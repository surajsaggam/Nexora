"""
NEXORA Decision Engine - Automated Test Suite
Verifies:
1. Candidate action generation (discrete bounded set, 24.5C target)
2. Digital Twin 45-minute lookahead simulation (physics.py integration)
3. Safety Gate 5/5 PASS scenario
4. Safety Gate Comfort FAIL scenario
5. Safety Gate IAQ FAIL scenario
6. Safety Gate Anti-cycle lockout FAIL (< 15m)
7. Mission-critical zone protection (Server Room z07 setback block)
8. Low-confidence rejection (< 85%)
9. Complete Zone 04 (Conference Suite B) end-to-end decision flow
"""

from datetime import datetime
import pytest

from backend.decision_engine.candidates import CandidateAction, generate_candidate_actions
from backend.decision_engine.engine import DecisionEngine
from backend.decision_engine.safety_gate import SafetyGate
from backend.decision_engine.what_if import WhatIfResult, evaluate_what_if
from backend.simulator.config import ZONES


def test_candidate_generation():
    """Verifies that discrete candidate actions are generated with project-defined 24.5C target."""
    candidates = generate_candidate_actions("z04", current_setpoint_c=21.0, current_lighting_pct=100.0)

    assert len(candidates) == 3
    action_ids = [c.id for c in candidates]
    assert "NO_ACTION" in action_ids
    assert "HVAC_SETBACK" in action_ids
    assert "HVAC_SETBACK_LIGHTING_DIM" in action_ids

    setback = next(c for c in candidates if c.id == "HVAC_SETBACK")
    assert setback.target_setpoint_c == 24.5
    assert setback.hvac_mode == "SETBACK"
    assert setback.lighting_level_pct == 100.0

    combined = next(c for c in candidates if c.id == "HVAC_SETBACK_LIGHTING_DIM")
    assert combined.target_setpoint_c == 24.5
    assert combined.lighting_level_pct == 15.0
    assert combined.fan_speed == "LOW"


def test_digital_twin_what_if_prediction():
    """Verifies 45-minute forward simulation produces physically consistent results."""
    candidates = generate_candidate_actions("z04", current_setpoint_c=21.0, current_lighting_pct=100.0)
    combined = next(c for c in candidates if c.id == "HVAC_SETBACK_LIGHTING_DIM")

    what_if = evaluate_what_if(
        zone_id="z04",
        action=combined,
        current_temp_c=21.2,
        current_co2_ppm=420.0,
        current_humidity_pct=46.0,
        current_occupancy=0,
        predicted_future_occupancy=0,
        lookahead_minutes=45,
    )

    assert what_if.evidence == "SIMULATED"
    assert what_if.lookahead_minutes == 45
    assert len(what_if.trajectory) == 3  # 15m, 30m, 45m steps
    assert what_if.temp_drift_c >= 0.0    # Temperature should drift up during setback
    assert what_if.predicted_power_kw < what_if.counterfactual_baseline_power_kw
    assert what_if.estimated_load_reduction_kw > 1.0
    assert what_if.is_comfort_preserved is True
    assert what_if.is_iaq_preserved is True


def test_safety_gate_all_pass():
    """Verifies all 5 checks pass for a compliant, high-confidence setback action."""
    gate = SafetyGate()
    candidates = generate_candidate_actions("z04", current_setpoint_c=21.0, current_lighting_pct=100.0)
    combined = next(c for c in candidates if c.id == "HVAC_SETBACK_LIGHTING_DIM")

    what_if = evaluate_what_if(
        zone_id="z04",
        action=combined,
        current_temp_c=21.2,
        current_co2_ppm=420.0,
        current_humidity_pct=46.0,
        current_occupancy=0,
        predicted_future_occupancy=0,
    )

    res = gate.evaluate(
        zone_id="z04",
        action=combined,
        what_if=what_if,
        model_confidence_pct=95.0,
        elapsed_since_last_actuation_min=54.0,
        is_executive_lock=False,
    )

    assert res.all_passed is True
    assert res.passed_count == 5
    assert res.total_count == 5
    assert res.rejection_reason is None


def test_safety_gate_comfort_fail():
    """Verifies that predicted temperature exceeding upper comfort boundary triggers FAIL."""
    gate = SafetyGate()
    candidates = generate_candidate_actions("z04", current_setpoint_c=21.0, current_lighting_pct=100.0)
    combined = next(c for c in candidates if c.id == "HVAC_SETBACK_LIGHTING_DIM")

    what_if = evaluate_what_if(
        zone_id="z04",
        action=combined,
        current_temp_c=25.0,
        current_co2_ppm=420.0,
        current_humidity_pct=46.0,
        current_occupancy=0,
        predicted_future_occupancy=0,
    )
    # Manually simulate an extreme overheat condition
    what_if.predicted_temperature_c = 26.2  # Exceeds max 25.5C

    res = gate.evaluate(
        zone_id="z04",
        action=combined,
        what_if=what_if,
        model_confidence_pct=95.0,
        elapsed_since_last_actuation_min=54.0,
    )

    assert res.all_passed is False
    comfort_chk = next(c for c in res.checks if c.category == "COMFORT")
    assert comfort_chk.passed is False
    assert "violates" in res.rejection_reason.lower()


def test_safety_gate_iaq_fail():
    """Verifies that high CO2 concentrations trigger IAQ check failure."""
    gate = SafetyGate()
    candidates = generate_candidate_actions("z04", current_setpoint_c=21.0, current_lighting_pct=100.0)
    combined = next(c for c in candidates if c.id == "HVAC_SETBACK_LIGHTING_DIM")

    what_if = evaluate_what_if(
        zone_id="z04",
        action=combined,
        current_temp_c=21.2,
        current_co2_ppm=420.0,
        current_humidity_pct=46.0,
        current_occupancy=0,
        predicted_future_occupancy=0,
    )
    what_if.predicted_co2_ppm = 1050.0  # Exceeds 950 ppm limit

    res = gate.evaluate(
        zone_id="z04",
        action=combined,
        what_if=what_if,
        model_confidence_pct=95.0,
    )

    assert res.all_passed is False
    iaq_chk = next(c for c in res.checks if c.category == "IAQ")
    assert iaq_chk.passed is False
    assert "iaq" in res.rejection_reason.lower() or "co2" in res.rejection_reason.lower()


def test_safety_gate_anti_cycle_lockout_fail():
    """Verifies compressor rapid cycling is blocked when elapsed time < 15m."""
    gate = SafetyGate()
    candidates = generate_candidate_actions("z04", current_setpoint_c=21.0, current_lighting_pct=100.0)
    combined = next(c for c in candidates if c.id == "HVAC_SETBACK_LIGHTING_DIM")

    what_if = evaluate_what_if(
        zone_id="z04",
        action=combined,
        current_temp_c=21.2,
        current_co2_ppm=420.0,
        current_humidity_pct=46.0,
        current_occupancy=0,
        predicted_future_occupancy=0,
    )

    # Only 6 minutes elapsed since last actuation
    res = gate.evaluate(
        zone_id="z04",
        action=combined,
        what_if=what_if,
        model_confidence_pct=95.0,
        elapsed_since_last_actuation_min=6.0,
    )

    assert res.all_passed is False
    equip_chk = next(c for c in res.checks if c.category == "EQUIPMENT")
    assert equip_chk.passed is False
    assert "lockout" in equip_chk.detail.lower()


def test_critical_zone_server_room_protection():
    """Verifies that mission-critical server room (z07) is strictly protected against automated setbacks."""
    gate = SafetyGate()
    candidates = generate_candidate_actions("z07", current_setpoint_c=19.5, current_lighting_pct=20.0)
    setback = next(c for c in candidates if c.id == "HVAC_SETBACK")

    what_if = evaluate_what_if(
        zone_id="z07",
        action=setback,
        current_temp_c=19.5,
        current_co2_ppm=412.0,
        current_humidity_pct=44.0,
        current_occupancy=0,
        predicted_future_occupancy=0,
    )

    res = gate.evaluate(
        zone_id="z07",
        action=setback,
        what_if=what_if,
        model_confidence_pct=95.0,
        elapsed_since_last_actuation_min=60.0,
    )

    assert res.all_passed is False
    rule_chk = next(c for c in res.checks if c.category == "OPERATING_RULE")
    assert rule_chk.passed is False
    assert "mission-critical" in rule_chk.detail.lower() or "server room" in rule_chk.detail.lower()


def test_low_confidence_rejection():
    """Verifies that model predictions with confidence below 85.0% are rejected."""
    gate = SafetyGate()
    candidates = generate_candidate_actions("z04", current_setpoint_c=21.0, current_lighting_pct=100.0)
    combined = next(c for c in candidates if c.id == "HVAC_SETBACK_LIGHTING_DIM")

    what_if = evaluate_what_if(
        zone_id="z04",
        action=combined,
        current_temp_c=21.2,
        current_co2_ppm=420.0,
        current_humidity_pct=46.0,
        current_occupancy=0,
        predicted_future_occupancy=0,
    )

    # Low confidence (74.0% < 85.0%)
    res = gate.evaluate(
        zone_id="z04",
        action=combined,
        what_if=what_if,
        model_confidence_pct=74.0,
        elapsed_since_last_actuation_min=54.0,
    )

    assert res.all_passed is False
    conf_chk = next(c for c in res.checks if c.category == "MODEL_CONFIDENCE")
    assert conf_chk.passed is False
    assert "below required threshold" in conf_chk.detail.lower()


def test_zone04_end_to_end_decision_flow():
    """Verifies the complete closed loop on Zone 04 (Conference Suite B) early departure."""
    engine = DecisionEngine()

    result = engine.process_zone(
        zone_id="z04",
        actual_power_kw=5.60,
        current_occupancy=0,
        timestamp=datetime(2026, 10, 5, 14, 15),
        current_temp_c=21.2,
        current_setpoint_c=21.0,
        current_co2_ppm=420.0,
        lighting_pct=100.0,
        elapsed_since_last_actuation_min=54.0,
    )

    # 1. Check Explanations
    assert "vacant and consuming significantly above its learned baseline" in result.why_explanation
    assert "Raise HVAC setpoint to 24.5C and reduce lighting" in result.action_explanation
    assert "Predicted load reduction:" in result.impact_explanation
    assert result.safety_explanation == "5/5 checks passed."

    # 2. Check Selected Action
    assert result.selected_action.id == "HVAC_SETBACK_LIGHTING_DIM"
    assert result.selected_action.target_setpoint_c == 24.5
    assert result.selected_action.lighting_level_pct == 15.0

    # 3. Check Safety Gate Validation
    assert result.selected_safety.all_passed is True
    assert result.selected_safety.passed_count == 5

    # 4. Check Human-in-the-Loop Recommendation Object
    assert result.recommendation is not None
    rec = result.recommendation
    assert rec.status == "PENDING_APPROVAL"
    assert rec.requires_human_approval is True
    assert rec.evidence == "SIMULATED"
    assert rec.zone.code == "Z04-CSB"
    assert rec.predicted_impact.predicted_load_reduction_kw > 1.5
    assert rec.predicted_impact.avoided_energy_kwh > 1.0
    assert rec.predicted_impact.predicted_cost_savings_inr > 10.0

    # 5. Check Dict Serialization for FastAPI/Frontend
    rec_dict = rec.to_dict()
    assert isinstance(rec_dict, dict)
    assert rec_dict["recommendation_id"].startswith("rec-z04-")
    assert rec_dict["status"] == "PENDING_APPROVAL"
