"""
NEXORA Decision Engine - Human-In-The-Loop Recommendation Model
Packages the selected action, What-If impact, and Safety Gate validation into a clean,
auditable, and explainable recommendation object with status PENDING_APPROVAL.
"""

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional
from backend.decision_engine.candidates import CandidateAction
from backend.decision_engine.safety_gate import SafetyGateResult
from backend.decision_engine.what_if import WhatIfResult
from backend.simulator.config import ZONES, ZoneConfig


@dataclass
class ZoneMetadata:
    id: str
    code: str
    name: str
    floor: int
    area_sqm: float


@dataclass
class TriggerContext:
    signal: str
    anomaly_category: str
    anomaly_severity: str
    why: str


@dataclass
class CurrentStateContext:
    occupancy: int
    actual_power_kw: float
    expected_power_kw: float
    variance_delta_kw: float
    temperature_c: float
    target_setpoint_c: float
    co2_ppm: float
    lighting_pct: float
    evidence: str = "SIMULATED"


@dataclass
class ProposedActionContext:
    id: str
    name: str
    target_setpoint_c: float
    lighting_level_pct: float
    hvac_mode: str
    fan_speed: str
    summary_sentence: str


@dataclass
class PredictedImpactContext:
    predicted_load_reduction_kw: float
    avoided_energy_kwh: float
    predicted_cost_savings_inr: float
    predicted_temperature_c: float
    temp_drift_c: float
    predicted_co2_ppm: float
    comfort_impact_summary: str
    lookahead_minutes: int
    evidence: str = "SIMULATED"


@dataclass
class RecommendationObject:
    recommendation_id: str
    timestamp: str
    zone: ZoneMetadata
    trigger: TriggerContext
    confidence: float
    current_state: CurrentStateContext
    proposed_action: ProposedActionContext
    predicted_impact: PredictedImpactContext
    safety_gate: SafetyGateResult
    status: str = "PENDING_APPROVAL"
    requires_human_approval: bool = True
    evidence: str = "SIMULATED"

    def to_dict(self) -> Dict[str, Any]:
        """Serializes recommendation object for FastAPI and frontend contract."""
        data = asdict(self)
        return data


def build_recommendation(
    zone_id: str,
    action: CandidateAction,
    what_if: WhatIfResult,
    safety_gate: SafetyGateResult,
    current_occupancy: int,
    actual_power_kw: float,
    expected_power_kw: float,
    current_temp_c: float,
    current_setpoint_c: float,
    current_co2_ppm: float,
    current_lighting_pct: float,
    confidence_score: float,
    anomaly_category: str,
    anomaly_severity: str,
    timestamp: Optional[datetime] = None,
    commercial_tariff_inr_per_kwh: float = 9.5,
) -> RecommendationObject:
    """
    Constructs a complete, auditable recommendation object.
    """
    cfg = ZONES[zone_id]
    dt = timestamp or datetime.now()
    rec_id = f"rec-{zone_id}-{dt.strftime('%H%M%S')}"

    # Calculate INR savings: avoided energy kWh * commercial electricity tariff
    cost_savings = round(what_if.avoided_energy_kwh * commercial_tariff_inr_per_kwh, 2)
    var_delta = round(actual_power_kw - expected_power_kw, 2)

    return RecommendationObject(
        recommendation_id=rec_id,
        timestamp=dt.isoformat(),
        zone=ZoneMetadata(
            id=cfg.id,
            code=cfg.code,
            name=cfg.name,
            floor=cfg.floor,
            area_sqm=cfg.area_sqm,
        ),
        trigger=TriggerContext(
            signal=f"Occupancy dropped to {current_occupancy} while HVAC was actively cooling at {current_setpoint_c:.1f}C and lighting was {current_lighting_pct:.0f}%.",
            anomaly_category=anomaly_category,
            anomaly_severity=anomaly_severity,
            why="Zone is vacant and consuming significantly above its learned baseline.",
        ),
        confidence=confidence_score,
        current_state=CurrentStateContext(
            occupancy=current_occupancy,
            actual_power_kw=actual_power_kw,
            expected_power_kw=expected_power_kw,
            variance_delta_kw=var_delta,
            temperature_c=current_temp_c,
            target_setpoint_c=current_setpoint_c,
            co2_ppm=current_co2_ppm,
            lighting_pct=current_lighting_pct,
            evidence="SIMULATED",
        ),
        proposed_action=ProposedActionContext(
            id=action.id,
            name=action.name,
            target_setpoint_c=action.target_setpoint_c,
            lighting_level_pct=action.lighting_level_pct,
            hvac_mode=action.hvac_mode,
            fan_speed=action.fan_speed,
            summary_sentence=f"Raise HVAC setpoint to {action.target_setpoint_c:.1f}C and reduce lighting to {action.lighting_level_pct:.0f}%.",
        ),
        predicted_impact=PredictedImpactContext(
            predicted_load_reduction_kw=what_if.estimated_load_reduction_kw,
            avoided_energy_kwh=what_if.avoided_energy_kwh,
            predicted_cost_savings_inr=cost_savings,
            predicted_temperature_c=what_if.predicted_temperature_c,
            temp_drift_c=what_if.temp_drift_c,
            predicted_co2_ppm=what_if.predicted_co2_ppm,
            comfort_impact_summary=what_if.comfort_impact_summary,
            lookahead_minutes=what_if.lookahead_minutes,
            evidence="SIMULATED",
        ),
        safety_gate=safety_gate,
        status="PENDING_APPROVAL",
        requires_human_approval=True,
        evidence="SIMULATED",
    )
