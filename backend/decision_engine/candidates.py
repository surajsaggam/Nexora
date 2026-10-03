"""
NEXORA Decision Engine - Candidate Actions Generator
Generates a discrete, physically grounded set of candidate actions for a zone.
Conforms to AGENTS.md: NO open-ended optimizer, discrete bounded set only.
"""

from dataclasses import dataclass
from typing import List
from backend.simulator.config import FanSpeed, HVACMode, ZoneConfig, ZONES


@dataclass(frozen=True)
class CandidateAction:
    id: str
    name: str
    hvac_mode: HVACMode
    target_setpoint_c: float
    lighting_level_pct: float
    fan_speed: FanSpeed
    description: str


def generate_candidate_actions(
    zone_id: str,
    current_setpoint_c: float,
    current_lighting_pct: float,
    setback_target_temp_c: float = 24.5,
    setback_dim_lighting_pct: float = 15.0,
) -> List[CandidateAction]:
    """
    Generates the discrete candidate actions for a zone:
    1. NO_ACTION (maintain status quo)
    2. HVAC_SETBACK (elevate setpoint to 24.5°C, maintain current lighting)
    3. HVAC_SETBACK_LIGHTING_DIM (elevate setpoint to 24.5°C AND dim lights to 15%)
    """
    cfg = ZONES.get(zone_id)
    if not cfg:
        raise ValueError(f"Unknown zone_id: {zone_id}")

    candidates = [
        # Candidate 0: No action (status quo)
        CandidateAction(
            id="NO_ACTION",
            name="Maintain Status Quo",
            hvac_mode="COOLING",
            target_setpoint_c=current_setpoint_c,
            lighting_level_pct=current_lighting_pct,
            fan_speed="AUTO" if zone_id != "z07" else "HIGH",
            description=f"Continue operating at current setpoint {current_setpoint_c:.1f}C and {current_lighting_pct:.0f}% lighting.",
        ),
        # Candidate 1: HVAC Setback only
        CandidateAction(
            id="HVAC_SETBACK",
            name="HVAC Thermal Setback (24.5C)",
            hvac_mode="SETBACK",
            target_setpoint_c=setback_target_temp_c,
            lighting_level_pct=current_lighting_pct,
            fan_speed="LOW",
            description=f"Raise cooling setpoint to {setback_target_temp_c:.1f}C with fan at low speed. Maintain lighting.",
        ),
        # Candidate 2: HVAC Setback + Lighting Dimming (Combined efficiency)
        CandidateAction(
            id="HVAC_SETBACK_LIGHTING_DIM",
            name="HVAC Setback (24.5C) + Lighting Dim (15%)",
            hvac_mode="SETBACK",
            target_setpoint_c=setback_target_temp_c,
            lighting_level_pct=setback_dim_lighting_pct,
            fan_speed="LOW",
            description=f"Raise setpoint to {setback_target_temp_c:.1f}C, reduce fan to low, and dim lighting to {setback_dim_lighting_pct:.0f}%.",
        ),
    ]

    return candidates
