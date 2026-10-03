"""
NEXORA Building Intelligence Platform - Core Simulation Engine
Orchestrates weather, occupancy, physical integration, and KPI calculations across all 8 zones.
Produces deterministic, physically grounded time-series data flagged as SIMULATED.
"""

from datetime import datetime, timedelta
import random
from typing import Dict, List, Optional

from backend.simulator.config import (
    FanSpeed,
    HVACMode,
    SCENARIOS,
    SimulationScenario,
    ZONES,
    ZoneConfig,
)
from backend.simulator.occupancy import compute_all_zones_occupancy
from backend.simulator.physics import (
    BuildingSnapshot,
    ZoneState,
    step_zone_physics,
)
from backend.simulator.weather import compute_weather


class NexoraBuildingSimulator:
    """
    Stateful first-principles simulator for the Apex Horizon Complex (Floor 4, 1,000 m²).
    Simulates:
    - 8 continuous thermal & IAQ zones
    - Dynamic occupancy profiles with calendar schedules
    - Variable chiller COP, fan power, and lighting dimming
    - Anomaly conditions (e.g. Z04 Conference Suite B early departure)
    """

    def __init__(self, scenario_id: str = "standard", random_seed: int = 42):
        self.scenario: SimulationScenario = SCENARIOS.get(scenario_id, SCENARIOS["standard"])
        self.rng = random.Random(random_seed)
        self.zone_states: Dict[str, dict] = {}
        self.reset_state()

    def reset_state(self):
        """Initializes all zones to default baseline conditions."""
        self.zone_states = {}
        for zid, cfg in ZONES.items():
            self.zone_states[zid] = {
                "temperature": cfg.base_setpoint,
                "target_setpoint": cfg.base_setpoint,
                "co2": 440.0,
                "humidity": 50.0,
                "hvac_mode": "COOLING",
                "fan_speed": "AUTO" if zid != "z07" else "HIGH",
                "lighting_pct": 85.0 if zid != "z07" else 20.0,
                "manual_override": False,
            }

    def set_scenario(self, scenario_id: str):
        if scenario_id in SCENARIOS:
            self.scenario = SCENARIOS[scenario_id]

    def apply_control_action(
        self,
        zone_id: str,
        setpoint: Optional[float] = None,
        lighting_pct: Optional[float] = None,
        hvac_mode: Optional[HVACMode] = None,
        fan_speed: Optional[FanSpeed] = None,
    ):
        """Facility manager or AI control intervention dispatch."""
        if zone_id not in self.zone_states:
            return
        st = self.zone_states[zone_id]
        if setpoint is not None:
            st["target_setpoint"] = setpoint
        if lighting_pct is not None:
            st["lighting_pct"] = lighting_pct
        if hvac_mode is not None:
            st["hvac_mode"] = hvac_mode
        if fan_speed is not None:
            st["fan_speed"] = fan_speed

    def step(
        self,
        dt: datetime,
        dt_hours: float = 0.25,
        inject_anomalies: bool = True,
    ) -> BuildingSnapshot:
        """
        Executes a single discrete simulation step across all 8 zones.
        """
        weather = compute_weather(dt, self.scenario)
        occupancies = compute_all_zones_occupancy(
            dt=dt,
            occupancy_multiplier=self.scenario.occupancy_multiplier,
            rng=self.rng,
            inject_suite_b_anomaly=inject_anomalies,
        )

        zones_out: Dict[str, ZoneState] = {}
        total_occ = 0
        total_hvac_kw = 0.0
        total_lighting_kw = 0.0
        total_equipment_kw = 0.0
        total_power_kw = 0.0
        total_baseline_kw = 0.0

        for zid, cfg in ZONES.items():
            st = self.zone_states[zid]
            occ_info = occupancies[zid]
            occ_count = occ_info.current_occupancy
            total_occ += occ_count

            # Determine if this zone has an active anomaly
            is_anomaly = False
            anomaly_desc = ""
            if inject_anomalies and zid == "z04" and occ_info.is_early_vacated:
                # The infamous Conference Suite B early departure!
                # Meeting vacated 42m early, but cooling is blasting at 21.0°C and lighting is 100%
                is_anomaly = True
                anomaly_desc = "Meeting vacated early. High cooling & 100% lighting active with 0 occupants."

            # Update lighting schedule automatically if not manually overridden
            if not st["manual_override"]:
                if occ_count == 0 and zid != "z07" and not is_anomaly:
                    # Automatically dim vacant rooms at night or normal schedule
                    st["lighting_pct"] = 0.0 if (dt.hour < 7 or dt.hour >= 20) else 15.0
                elif is_anomaly:
                    st["lighting_pct"] = 100.0  # Lights left on during anomaly
                elif occ_count > 0:
                    st["lighting_pct"] = 90.0 if zid in ("z03", "z04") else 80.0

            # Execute physics integration
            z_state = step_zone_physics(
                cfg=cfg,
                current_temp=st["temperature"],
                current_co2=st["co2"],
                current_humidity=st["humidity"],
                occupancy=occ_count,
                target_setpoint=st["target_setpoint"],
                hvac_mode=st["hvac_mode"],
                fan_speed=st["fan_speed"],
                lighting_pct=st["lighting_pct"],
                weather=weather,
                dt_hours=dt_hours,
                is_anomaly=is_anomaly,
                anomaly_desc=anomaly_desc,
            )

            # Update internal state for next timestep
            st["temperature"] = z_state.temperature_c
            st["co2"] = z_state.co2_ppm
            st["humidity"] = z_state.humidity_pct

            zones_out[zid] = z_state
            total_hvac_kw += z_state.hvac_electrical_kw
            total_lighting_kw += z_state.lighting_electrical_kw
            total_equipment_kw += z_state.equipment_electrical_kw
            total_power_kw += z_state.total_zone_electrical_kw
            total_baseline_kw += z_state.baseline_expected_kw

        # Whole-building compliance rates
        compliant_temp_zones = sum(
            1
            for zid, zs in zones_out.items()
            if ZONES[zid].comfort_band.min_temp <= zs.temperature_c <= ZONES[zid].comfort_band.max_temp
        )
        compliant_iaq_zones = sum(
            1
            for zid, zs in zones_out.items()
            if zs.co2_ppm <= ZONES[zid].comfort_band.max_co2
        )

        comfort_pct = round((compliant_temp_zones / len(ZONES)) * 100.0, 1)
        iaq_pct = round((compliant_iaq_zones / len(ZONES)) * 100.0, 1)
        active_anomalies = sum(1 for zs in zones_out.values() if zs.has_anomaly)
        variance_kw = round(total_power_kw - total_baseline_kw, 2)

        return BuildingSnapshot(
            timestamp_iso=dt.isoformat(),
            scenario_id=self.scenario.id,
            outdoor_temp_c=weather.outdoor_temp_c,
            outdoor_humidity_pct=weather.outdoor_humidity_pct,
            solar_irradiance_w_per_m2=weather.solar_irradiance_w_per_m2,
            total_building_occupancy=total_occ,
            total_hvac_power_kw=round(total_hvac_kw, 2),
            total_lighting_power_kw=round(total_lighting_kw, 2),
            total_equipment_power_kw=round(total_equipment_kw, 2),
            gross_building_power_kw=round(total_power_kw, 2),
            baseline_building_power_kw=round(total_baseline_kw, 2),
            variance_delta_kw=variance_kw,
            comfort_compliance_pct=comfort_pct,
            iaq_compliance_pct=iaq_pct,
            active_anomalies_count=active_anomalies,
            zones=zones_out,
            evidence="SIMULATED",
        )

    def run_simulation(
        self,
        start_dt: datetime,
        days: int = 7,
        step_minutes: int = 15,
        inject_anomalies: bool = True,
    ) -> List[BuildingSnapshot]:
        """
        Runs a batch simulation over multiple days.
        Used for ML model training data generation and verification benchmarking.
        """
        dt_hours = step_minutes / 60.0
        total_steps = int((days * 24 * 60) / step_minutes)
        current_dt = start_dt
        snapshots: List[BuildingSnapshot] = []

        for _ in range(total_steps):
            snap = self.step(
                dt=current_dt,
                dt_hours=dt_hours,
                inject_anomalies=inject_anomalies,
            )
            snapshots.append(snap)
            current_dt += timedelta(minutes=step_minutes)

        return snapshots
