"""
NEXORA Simulation Service - First-Principles Physics & Thermal Dynamics Engine
Models:
1. Zone thermal heat balance (conduction, solar, metabolic, plug loads, HVAC cooling)
2. Chiller electrical power, variable COP, and fan affinity laws
3. Zone CO2 single-box mass balance with ventilation dilution (ASHRAE 62.1)
4. Humidity moisture balance
5. Zone and building electrical power rollups
"""

import math
from typing import Dict, NamedTuple
from backend.simulator.config import (
    BASE_CHILLER_COP,
    BUILDING_TOTAL_AREA_SQM,
    FanSpeed,
    HVACMode,
    HUMAN_CO2_GEN_L_PER_S,
    HUMAN_METABOLIC_HEAT_KW,
    LIGHTING_HEAT_FRACTION,
    OUTDOOR_BASE_CO2_PPM,
    ZoneConfig,
    ZONES,
)
from backend.simulator.weather import WeatherState


class ZoneState(NamedTuple):
    zone_id: str
    temperature_c: float
    target_setpoint_c: float
    co2_ppm: float
    humidity_pct: float
    occupancy: int
    hvac_mode: HVACMode
    fan_speed: FanSpeed
    cooling_thermal_kw: float
    hvac_electrical_kw: float
    lighting_level_pct: float
    lighting_electrical_kw: float
    equipment_electrical_kw: float
    total_zone_electrical_kw: float
    baseline_expected_kw: float
    has_anomaly: bool
    anomaly_description: str
    evidence: str = "SIMULATED"


def compute_chiller_cop(outdoor_temp_c: float) -> float:
    """
    Computes ambient-dependent chiller Coefficient of Performance (COP).
    Typical water/air-cooled chiller degrades ~1.5% efficiency per °C above 32°C.
    """
    cop = BASE_CHILLER_COP * (1.0 - 0.015 * (outdoor_temp_c - 32.0))
    return max(2.1, min(5.0, cop))


def compute_fan_electrical_kw(cfg: ZoneConfig, fan_speed: FanSpeed) -> float:
    """
    Computes AHU fan power using the Fan Affinity Law (P ~ RPM³).
    """
    base_fan_nominal_kw = cfg.area_sqm * 0.0035  # ~0.35 W/m² baseline fan sizing
    ratios = {
        "OFF": 0.0,
        "LOW": 0.35,
        "MED": 0.65,
        "HIGH": 1.0,
        "AUTO": 0.70,
    }
    ratio = ratios.get(fan_speed, 0.70)
    return base_fan_nominal_kw * (ratio ** 3)


def step_zone_physics(
    cfg: ZoneConfig,
    current_temp: float,
    current_co2: float,
    current_humidity: float,
    occupancy: int,
    target_setpoint: float,
    hvac_mode: HVACMode,
    fan_speed: FanSpeed,
    lighting_pct: float,
    weather: WeatherState,
    dt_hours: float = 0.25,  # 15 minutes = 0.25 hours
    is_anomaly: bool = False,
    anomaly_desc: str = "",
) -> ZoneState:
    """
    Performs one discrete numerical integration step of zone thermal and IAQ physics.
    Conservation of energy: C_th * dT/dt = Q_env + Q_int - Q_cooling
    """
    # 1. Thermal Gains
    # Envelope transmission conduction (Q_env = UA * (T_out - T_in))
    q_envelope = cfg.envelope_ua_kw_per_c * (weather.outdoor_temp_c - current_temp)

    # Solar heat gain (direct through glazing)
    # Estimate glazing area ~ 15% of floor area for exterior zones
    solar_aperture_m2 = cfg.area_sqm * 0.12 if "Workspace" in cfg.name or "Lab" in cfg.name or "Atrium" in cfg.name else 0.0
    q_solar = (weather.solar_irradiance_w_per_m2 / 1000.0) * solar_aperture_m2 * 0.55  # SHGC = 0.55

    # Internal heat gains: occupants + plug load + lighting heat
    q_occupants = occupancy * HUMAN_METABOLIC_HEAT_KW
    q_equipment = cfg.equipment_base_heat_kw
    lighting_kw = cfg.installed_lighting_kw * (lighting_pct / 100.0)
    q_lighting = lighting_kw * LIGHTING_HEAT_FRACTION

    total_heat_gain = q_envelope + q_solar + q_occupants + q_equipment + q_lighting

    # 2. HVAC Cooling Control (Thermostatic Proportional Control)
    q_cooling_thermal = 0.0
    cop = compute_chiller_cop(weather.outdoor_temp_c)

    if hvac_mode == "COOLING":
        # System actively cools to meet target setpoint
        temp_error = current_temp - target_setpoint
        if temp_error > 0:
            # Proportional gain: 3.5 kW per °C deviation + steady state load
            cooling_demand = max(0.0, temp_error * 3.8 + max(0.0, total_heat_gain))
            q_cooling_thermal = min(cfg.max_cooling_kw, cooling_demand)
        else:
            # At or below setpoint: minimum cooling/ventilation coil
            q_cooling_thermal = max(0.0, total_heat_gain * 0.4)

    elif hvac_mode == "SETBACK":
        # Setback mode: allows temperature to float up toward elevated setpoint (e.g. 24.5°C)
        temp_error = current_temp - target_setpoint
        if temp_error > 0.3:
            q_cooling_thermal = min(cfg.max_cooling_kw * 0.45, temp_error * 2.0)
        else:
            q_cooling_thermal = 0.0

    elif hvac_mode == "STANDBY":
        # Standby: only cool if exceeding upper comfort limit
        if current_temp > cfg.comfort_band.max_temp:
            q_cooling_thermal = min(cfg.max_cooling_kw * 0.5, (current_temp - cfg.comfort_band.max_temp) * 3.0)
        else:
            q_cooling_thermal = 0.0

    elif hvac_mode == "OFF":
        q_cooling_thermal = 0.0

    # 3. Temperature Integration
    net_heat_kw = total_heat_gain - q_cooling_thermal
    # dT = net_heat / C_th * dt_hours
    temp_delta = (net_heat_kw / cfg.thermal_capacitance_kwh_per_c) * dt_hours
    new_temp = round(current_temp + temp_delta, 2)

    # 4. HVAC Electrical Power
    fan_kw = compute_fan_electrical_kw(cfg, fan_speed)
    chiller_electric_kw = q_cooling_thermal / cop
    total_hvac_electric_kw = round(chiller_electric_kw + fan_kw, 2)

    # 5. Total Zone Electrical Power
    total_zone_electric_kw = round(total_hvac_electric_kw + lighting_kw + cfg.equipment_base_heat_kw, 2)

    # 6. Expected Baseline Electrical Power (Normal schedule standard model)
    # Baseline assumes standard occupied setpoint and weather without anomaly
    baseline_hvac_kw = max(0.8, (cfg.area_sqm / 32.0) * (1.0 + 0.04 * max(0.0, weather.outdoor_temp_c - 28.0)))
    baseline_expected_kw = round(baseline_hvac_kw + cfg.installed_lighting_kw * 0.85 + cfg.equipment_base_heat_kw, 2)

    # 7. CO2 Mass Balance
    # Infiltration + Mechanical ventilation airflow (m³/s)
    vent_airflow_m3_s = cfg.min_fresh_air_m3_per_s + (occupancy * cfg.fresh_air_per_person_m3_per_s)
    # Human generation rate in m³/s of pure CO2: 0.0052 L/s = 5.2e-6 m³/s per person
    co2_gen_m3_s = occupancy * (HUMAN_CO2_GEN_L_PER_S / 1000.0)

    # dt in seconds
    dt_seconds = dt_hours * 3600.0
    # Mass balance: V * dC/dt = G + Q_vent * (C_out - C_in)
    # Exponential decay / analytical step for numerical stability
    air_changes_per_s = vent_airflow_m3_s / cfg.air_volume_m3
    c_steady_state = OUTDOOR_BASE_CO2_PPM + (co2_gen_m3_s / max(1e-5, vent_airflow_m3_s)) * 1e6
    decay_factor = math.exp(-air_changes_per_s * dt_seconds)
    new_co2 = round(c_steady_state + (current_co2 - c_steady_state) * decay_factor, 1)
    new_co2 = max(OUTDOOR_BASE_CO2_PPM, min(1800.0, new_co2))

    # 8. Humidity Balance (Sensible/Latent Equilibrium)
    target_humidity = 50.0 + (occupancy / max(1, cfg.max_capacity)) * 8.0 - (q_cooling_thermal / cfg.max_cooling_kw) * 6.0
    humidity_delta = (target_humidity - current_humidity) * (1.0 - math.exp(-0.8 * dt_hours))
    new_humidity = round(max(35.0, min(70.0, current_humidity + humidity_delta)), 1)

    return ZoneState(
        zone_id=cfg.id,
        temperature_c=new_temp,
        target_setpoint_c=target_setpoint,
        co2_ppm=new_co2,
        humidity_pct=new_humidity,
        occupancy=occupancy,
        hvac_mode=hvac_mode,
        fan_speed=fan_speed,
        cooling_thermal_kw=round(q_cooling_thermal, 2),
        hvac_electrical_kw=total_hvac_electric_kw,
        lighting_level_pct=lighting_pct,
        lighting_electrical_kw=round(lighting_kw, 2),
        equipment_electrical_kw=cfg.equipment_base_heat_kw,
        total_zone_electrical_kw=total_zone_electric_kw,
        baseline_expected_kw=baseline_expected_kw,
        has_anomaly=is_anomaly,
        anomaly_description=anomaly_desc,
        evidence="SIMULATED",
    )


class BuildingSnapshot(NamedTuple):
    timestamp_iso: str
    scenario_id: str
    outdoor_temp_c: float
    outdoor_humidity_pct: float
    solar_irradiance_w_per_m2: float
    total_building_occupancy: int
    total_hvac_power_kw: float
    total_lighting_power_kw: float
    total_equipment_power_kw: float
    gross_building_power_kw: float
    baseline_building_power_kw: float
    variance_delta_kw: float
    comfort_compliance_pct: float
    iaq_compliance_pct: float
    active_anomalies_count: int
    zones: Dict[str, ZoneState]
    evidence: str = "SIMULATED"
