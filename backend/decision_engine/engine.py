"""
NEXORA Decision Engine - Core Decision Orchestrator
Executes the closed-loop decision flow:
ML Detection → Candidate Actions → Digital Twin What-If → Safety Gate → Recommendation.
Selects the safest, highest-impact eligible action and packages it for Human-In-The-Loop approval.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.decision_engine.candidates import CandidateAction, generate_candidate_actions
from backend.decision_engine.recommendation import RecommendationObject, build_recommendation
from backend.decision_engine.safety_gate import SafetyGate, SafetyGateResult
from backend.decision_engine.what_if import WhatIfResult, evaluate_what_if
from backend.ml.inference import MLIntelligenceService
from backend.simulator.config import ZONES


@dataclass
class CandidateEvaluation:
    action: CandidateAction
    what_if: WhatIfResult
    safety: SafetyGateResult
    is_eligible: bool


@dataclass
class DecisionResult:
    zone_id: str
    decision_timestamp: str
    why_explanation: str
    action_explanation: str
    impact_explanation: str
    safety_explanation: str
    selected_action: CandidateAction
    selected_what_if: WhatIfResult
    selected_safety: SafetyGateResult
    evaluated_candidates: List[CandidateEvaluation]
    recommendation: Optional[RecommendationObject]
    evidence: str = "SIMULATED"


class DecisionEngine:
    """
    Evaluates ML detection signals, runs digital twin what-if simulations,
    validates constraints through the safety gate, and produces explainable recommendations.
    """

    def __init__(
        self,
        ml_service: Optional[MLIntelligenceService] = None,
        safety_gate: Optional[SafetyGate] = None,
    ):
        self.ml_service = ml_service or MLIntelligenceService()
        self.safety_gate = safety_gate or SafetyGate()

    def process_zone(
        self,
        zone_id: str,
        actual_power_kw: float,
        current_occupancy: int,
        timestamp: Optional[datetime] = None,
        current_temp_c: float = 21.2,
        current_setpoint_c: float = 21.0,
        current_co2_ppm: float = 420.0,
        current_humidity_pct: float = 48.0,
        lighting_pct: float = 100.0,
        outdoor_temp_c: float = 33.2,
        outdoor_humidity_pct: float = 46.0,
        solar_irradiance_w_per_m2: float = 720.0,
        elapsed_since_last_actuation_min: float = 54.0,
        is_executive_lock: bool = False,
        lookahead_minutes: int = 45,
    ) -> DecisionResult:
        """
        Executes end-to-end decision flow for a zone.
        """
        dt = timestamp or datetime.now()
        cfg = ZONES.get(zone_id)
        if not cfg:
            raise ValueError(f"Unknown zone_id: {zone_id}")

        # -------------------------------------------------------------
        # Step 1: ML Intelligence Layer Assessment
        # -------------------------------------------------------------
        ml_assessment = self.ml_service.analyze_zone(
            zone_id=zone_id,
            actual_power_kw=actual_power_kw,
            current_occupancy=current_occupancy,
            timestamp=dt,
            outdoor_temp_c=outdoor_temp_c,
            outdoor_humidity_pct=outdoor_humidity_pct,
            solar_irradiance_w_per_m2=solar_irradiance_w_per_m2,
            current_temp_c=current_temp_c,
            target_setpoint_c=current_setpoint_c,
            lighting_pct=lighting_pct,
        )

        occ_forecast = ml_assessment["occupancy_forecast"]
        nrg_baseline = ml_assessment["energy_baseline"]
        anom_info = ml_assessment["anomaly"]

        # -------------------------------------------------------------
        # Step 2: Generate Discrete Candidate Actions
        # -------------------------------------------------------------
        candidates = generate_candidate_actions(
            zone_id=zone_id,
            current_setpoint_c=current_setpoint_c,
            current_lighting_pct=lighting_pct,
            setback_target_temp_c=24.5,
            setback_dim_lighting_pct=15.0,
        )

        # -------------------------------------------------------------
        # Steps 3 & 4: Digital Twin What-If & Safety Gate for each candidate
        # -------------------------------------------------------------
        evaluated: List[CandidateEvaluation] = []
        for cand in candidates:
            what_if = evaluate_what_if(
                zone_id=zone_id,
                action=cand,
                current_temp_c=current_temp_c,
                current_co2_ppm=current_co2_ppm,
                current_humidity_pct=current_humidity_pct,
                current_occupancy=current_occupancy,
                predicted_future_occupancy=occ_forecast["predicted_next_hour"],
                start_time=dt,
                lookahead_minutes=lookahead_minutes,
            )

            safety = self.safety_gate.evaluate(
                zone_id=zone_id,
                action=cand,
                what_if=what_if,
                model_confidence_pct=occ_forecast["confidence_score"],
                elapsed_since_last_actuation_min=elapsed_since_last_actuation_min,
                is_executive_lock=is_executive_lock,
            )

            is_eligible = safety.all_passed
            evaluated.append(
                CandidateEvaluation(
                    action=cand,
                    what_if=what_if,
                    safety=safety,
                    is_eligible=is_eligible,
                )
            )

        # -------------------------------------------------------------
        # Step 5: Action Selection (Highest Safe Load Reduction)
        # -------------------------------------------------------------
        # Filter eligible candidates that strictly passed the safety gate
        eligible_candidates = [e for e in evaluated if e.is_eligible and e.action.id != "NO_ACTION"]

        if eligible_candidates and (anom_info["is_anomaly"] or current_occupancy == 0):
            # Sort by highest load reduction
            eligible_candidates.sort(key=lambda e: e.what_if.estimated_load_reduction_kw, reverse=True)
            chosen = eligible_candidates[0]
        else:
            # Fallback to status quo if nothing is safe or no intervention warranted
            chosen = next(e for e in evaluated if e.action.id == "NO_ACTION")

        # -------------------------------------------------------------
        # Step 6: Formulate 4 Human Explanations
        # -------------------------------------------------------------
        # WHY
        if anom_info["is_anomaly"] and anom_info["category"] == "UNOCCUPIED_COOLING":
            why_exp = "Zone is vacant and consuming significantly above its learned baseline."
        elif anom_info["is_anomaly"]:
            why_exp = f"Active consumption exceeds expected baseline by +{nrg_baseline['variance_delta_kw']:.2f} kW."
        elif current_occupancy == 0:
            why_exp = "Zone is vacant with zero predicted arrivals over the next 60 minutes."
        else:
            why_exp = "Operating within normal parameters."

        # ACTION
        if chosen.action.id == "HVAC_SETBACK_LIGHTING_DIM":
            action_exp = f"Raise HVAC setpoint to {chosen.action.target_setpoint_c:.1f}C and reduce lighting."
        elif chosen.action.id == "HVAC_SETBACK":
            action_exp = f"Raise HVAC setpoint to {chosen.action.target_setpoint_c:.1f}C."
        else:
            action_exp = "Maintain current operating setpoints."

        # EXPECTED IMPACT
        impact_exp = f"Predicted load reduction: {chosen.what_if.estimated_load_reduction_kw:.2f} kW."

        # SAFETY
        safety_exp = f"{chosen.safety.passed_count}/{chosen.safety.total_count} checks passed."

        # -------------------------------------------------------------
        # Step 7: Build Structured Recommendation Object
        # -------------------------------------------------------------
        recommendation: Optional[RecommendationObject] = None
        if chosen.action.id != "NO_ACTION":
            recommendation = build_recommendation(
                zone_id=zone_id,
                action=chosen.action,
                what_if=chosen.what_if,
                safety_gate=chosen.safety,
                current_occupancy=current_occupancy,
                actual_power_kw=actual_power_kw,
                expected_power_kw=nrg_baseline["expected_power_kw"],
                current_temp_c=current_temp_c,
                current_setpoint_c=current_setpoint_c,
                current_co2_ppm=current_co2_ppm,
                current_lighting_pct=lighting_pct,
                confidence_score=occ_forecast["confidence_score"],
                anomaly_category=anom_info["category"],
                anomaly_severity=anom_info["severity"],
                timestamp=dt,
            )

        return DecisionResult(
            zone_id=zone_id,
            decision_timestamp=dt.isoformat(),
            why_explanation=why_exp,
            action_explanation=action_exp,
            impact_explanation=impact_exp,
            safety_explanation=safety_exp,
            selected_action=chosen.action,
            selected_what_if=chosen.what_if,
            selected_safety=chosen.safety,
            evaluated_candidates=evaluated,
            recommendation=recommendation,
            evidence="SIMULATED",
        )
