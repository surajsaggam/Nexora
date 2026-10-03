"""
NEXORA Decision Engine - Digital Twin What-If Evaluator
Projects zone thermodynamic response over a 45-minute forward horizon before committing actions.
Uses first-principles physics (backend/simulator/physics.py) to compute exact counterfactual savings and comfort drift.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from backend.decision_engine.candidates import CandidateAction
from backend.simulator.config import ZONES, ZoneConfig
from backend.simulator.physics import step_zone_physics
from backend.simulator.weather import compute_weather, WeatherState


@dataclass
class TrajectoryPoint:
    step_minutes: int
    temperature_c: float
    co2_ppm: float
    power_kw: float


@dataclass
class WhatIfResult:
    action_id: str
    action_name: str
    lookahead_minutes: int
    predicted_temperature_c: float
    predicted_co2_ppm: float
    predicted_humidity_pct: float
    predicted_power_kw: float
    counterfactual_baseline_power_kw: float  # Power if NO_ACTION is maintained
    estimated_load_reduction_kw: float       # Counterfactual - Candidate
    avoided_energy_kwh: float                # Cumulative energy reduction over 45m window
    temp_drift_c: float                      # Final temp - Initial temp
    is_comfort_preserved: bool
    is_iaq_preserved: bool
    comfort_impact_summary: str
    trajectory: List[TrajectoryPoint]
    evidence: str = "SIMULATED"


def evaluate_what_if(
    zone_id: str,
    action: CandidateAction,
    current_temp_c: float,
    current_co2_ppm: float,
    current_humidity_pct: float,
    current_occupancy: int,
    predicted_future_occupancy: int,
    start_time: Optional[datetime] = None,
    lookahead_minutes: int = 45,
    step_minutes: int = 15,
) -> WhatIfResult:
    """
    Simulates forward zone physics for `action` and compares against `NO_ACTION` status quo.
    Steps: 3 intervals of 15m = 45m lookahead.
    """
    cfg = ZONES.get(zone_id)
    if not cfg:
        raise ValueError(f"Unknown zone_id: {zone_id}")

    dt_start = start_time or datetime(2026, 10, 5, 14, 15)
    dt_hours = step_minutes / 60.0
    num_steps = lookahead_minutes // step_minutes

    # 1. Simulate Candidate Action trajectory
    cand_temp = current_temp_c
    cand_co2 = current_co2_ppm
    cand_hum = current_humidity_pct
    cand_trajectory: List[TrajectoryPoint] = []
    cand_powers: List[float] = []

    # 2. Simulate Counterfactual Status Quo (No Action, keep chilling)
    base_temp = current_temp_c
    base_co2 = current_co2_ppm
    base_hum = current_humidity_pct
    base_powers: List[float] = []

    for step_i in range(1, num_steps + 1):
        step_dt = dt_start + timedelta(minutes=step_i * step_minutes)
        weather = compute_weather(step_dt)

        # Occupancy transitions towards predicted next hour
        occ_step = predicted_future_occupancy if step_i >= 2 else current_occupancy

        # Candidate step
        cand_state = step_zone_physics(
            cfg=cfg,
            current_temp=cand_temp,
            current_co2=cand_co2,
            current_humidity=cand_hum,
            occupancy=occ_step,
            target_setpoint=action.target_setpoint_c,
            hvac_mode=action.hvac_mode,
            fan_speed=action.fan_speed,
            lighting_pct=action.lighting_level_pct,
            weather=weather,
            dt_hours=dt_hours,
        )
        cand_temp = cand_state.temperature_c
        cand_co2 = cand_state.co2_ppm
        cand_hum = cand_state.humidity_pct
        cand_powers.append(cand_state.total_zone_electrical_kw)
        cand_trajectory.append(
            TrajectoryPoint(
                step_minutes=step_i * step_minutes,
                temperature_c=cand_temp,
                co2_ppm=cand_co2,
                power_kw=cand_state.total_zone_electrical_kw,
            )
        )

        # Counterfactual Status Quo step (cooling continues at current setpoint, 100% lights if vacant meeting)
        base_state = step_zone_physics(
            cfg=cfg,
            current_temp=base_temp,
            current_co2=base_co2,
            current_humidity=base_hum,
            occupancy=occ_step,
            target_setpoint=cfg.base_setpoint if cfg.id != "z04" else 21.0,
            hvac_mode="COOLING",
            fan_speed="HIGH",
            lighting_pct=100.0 if cfg.id in ("z03", "z04") else 80.0,
            weather=weather,
            dt_hours=dt_hours,
        )
        base_temp = base_state.temperature_c
        base_co2 = base_state.co2_ppm
        base_hum = base_state.humidity_pct
        base_powers.append(base_state.total_zone_electrical_kw)

    # Final values at 45 minutes
    final_temp = cand_temp
    final_co2 = cand_co2
    final_hum = cand_hum
    final_power = cand_powers[-1]
    final_base_power = base_powers[-1]

    # Metrics
    temp_drift = round(final_temp - current_temp_c, 2)
    load_reduction_kw = round(max(0.0, final_base_power - final_power), 2)
    avoided_kwh = round(sum(max(0.0, bp - cp) * dt_hours for bp, cp in zip(base_powers, cand_powers)), 2)

    # Comfort & IAQ checks
    is_comfort = cfg.comfort_band.min_temp <= final_temp <= cfg.comfort_band.max_temp
    is_iaq = final_co2 <= cfg.comfort_band.max_co2

    if is_comfort:
        margin = round(cfg.comfort_band.max_temp - final_temp, 1)
        comfort_summary = (
            f"Comfort preserved: Temperature drifts from {current_temp_c:.1f}C to {final_temp:.1f}C "
            f"(+{temp_drift:+.1f}C drift over 45m), remaining {margin:.1f}C below {cfg.comfort_band.max_temp:.1f}C limit."
        )
    else:
        comfort_summary = (
            f"Comfort VIOLATION: Final temperature {final_temp:.1f}C exceeds comfort boundary "
            f"[{cfg.comfort_band.min_temp:.1f}C - {cfg.comfort_band.max_temp:.1f}C]."
        )

    return WhatIfResult(
        action_id=action.id,
        action_name=action.name,
        lookahead_minutes=lookahead_minutes,
        predicted_temperature_c=final_temp,
        predicted_co2_ppm=final_co2,
        predicted_humidity_pct=final_hum,
        predicted_power_kw=final_power,
        counterfactual_baseline_power_kw=final_base_power,
        estimated_load_reduction_kw=load_reduction_kw,
        avoided_energy_kwh=avoided_kwh,
        temp_drift_c=temp_drift,
        is_comfort_preserved=is_comfort,
        is_iaq_preserved=is_iaq,
        comfort_impact_summary=comfort_summary,
        trajectory=cand_trajectory,
        evidence="SIMULATED",
    )
