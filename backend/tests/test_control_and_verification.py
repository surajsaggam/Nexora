"""
NEXORA Control Execution & Verification Layer - Comprehensive Test Suite
Covers:
1. Valid control execution through SimulatedBMSControlExecutor
2. Unauthorized action rejection (missing human approval or direct bypass attempt)
3. Safety-gate failure preventing control execution
4. Simulator state actually changing (setpoint, lighting, mode, manual_override)
5. Post-action physical telemetry read-back directly from simulator
6. M&V calculation: Impact = Adjusted Baseline - Actual
7. Thermal comfort preservation validation
8. IAQ preservation validation
9. Successful verification (VERIFIED status)
10. Failed verification (NOT_VERIFIED status on comfort, IAQ, or negative savings)
11. Complete Zone 04 Conference Suite B closed-loop flow
"""

from datetime import datetime
import pytest

from backend.api.main import app
from backend.api.state import service
from backend.control.executor import (
    SimulatedBMSControlExecutor,
)
from backend.control.state import (
    BMSControlStateTracker,
    SUPPORTED_ACTIONS,
)
from backend.simulator.config import ZONES
from backend.simulator.engine import NexoraBuildingSimulator
from backend.verification.ledger import VerificationLedger
from backend.verification.mv import MVEngine, MVVerificationRecord
from fastapi.testclient import TestClient

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_system_state():
    """Ensures each test starts with a fresh baseline."""
    service.reset_to_suite_b_baseline()


def test_control_executor_supported_actions():
    """Verifies that executor enforces bounded discrete action set."""
    sim = NexoraBuildingSimulator()
    tracker = BMSControlStateTracker()
    executor = SimulatedBMSControlExecutor(simulator=sim, state_tracker=tracker)

    assert "NO_ACTION" in SUPPORTED_ACTIONS
    assert "HVAC_SETBACK" in SUPPORTED_ACTIONS
    assert "HVAC_SETBACK_LIGHTING_DIM" in SUPPORTED_ACTIONS


def test_valid_control_execution_updates_simulator_state():
    """
    Verifies that executing HVAC_SETBACK_LIGHTING_DIM updates:
    - target_setpoint = 24.5C
    - lighting_pct = 15.0%
    - hvac_mode = SETBACK
    - manual_override = True
    """
    sim = NexoraBuildingSimulator()
    tracker = BMSControlStateTracker()
    executor = SimulatedBMSControlExecutor(simulator=sim, state_tracker=tracker)

    rec = {
        "recommendation_id": "rec-z04-actuation",
        "zone_id": "Z04-CSB",
        "id": "z04",
        "action": "HVAC_SETBACK_LIGHTING_DIM",
        "target_setpoint_c": 24.5,
        "lighting_level_pct": 15.0,
        "hvac_mode": "SETBACK",
        "fan_speed": "LOW",
        "safety_gate_passed": True,
    }

    res = executor.execute_action(rec, is_human_approved=True)

    assert res.status == "EXECUTED"
    assert res.zone_id == "Z04-CSB"
    assert res.action == "HVAC_SETBACK_LIGHTING_DIM"
    assert res.setpoint_c == 24.5
    assert res.lighting_pct == 15.0
    assert res.evidence == "SIMULATED"

    # Confirm simulator physical state actually changed
    st = sim.zone_states["z04"]
    assert st["target_setpoint"] == 24.5
    assert st["lighting_pct"] == 15.0
    assert st["hvac_mode"] == "SETBACK"
    assert st["fan_speed"] == "LOW"
    assert st["manual_override"] is True


def test_unauthorized_control_action_rejected():
    """Verifies that an execution attempt without human approval is rejected."""
    sim = NexoraBuildingSimulator()
    tracker = BMSControlStateTracker()
    executor = SimulatedBMSControlExecutor(simulator=sim, state_tracker=tracker)

    rec = {
        "recommendation_id": "rec-z04-unapproved",
        "zone_id": "Z04-CSB",
        "id": "z04",
        "action": "HVAC_SETBACK_LIGHTING_DIM",
        "target_setpoint_c": 24.5,
        "lighting_level_pct": 15.0,
        "safety_gate_passed": True,
    }

    res = executor.execute_action(rec, is_human_approved=False)

    assert res.status == "REJECTED"
    assert res.authorized is False
    assert "unauthorized" in res.detail.lower()


def test_safety_gate_failure_prevents_execution():
    """Verifies that an action failing safety checks is rejected by the executor."""
    sim = NexoraBuildingSimulator()
    tracker = BMSControlStateTracker()
    executor = SimulatedBMSControlExecutor(simulator=sim, state_tracker=tracker)

    rec = {
        "recommendation_id": "rec-z04-unsafe",
        "zone_id": "Z04-CSB",
        "id": "z04",
        "action": "HVAC_SETBACK_LIGHTING_DIM",
        "target_setpoint_c": 24.5,
        "lighting_level_pct": 15.0,
        "safety_gate_passed": False,
        "rejection_reason": "Thermal comfort boundary exceeded",
    }

    res = executor.execute_action(rec, is_human_approved=True)

    assert res.status == "REJECTED"
    assert "safety gate rejection" in res.detail.lower()


def test_post_action_telemetry_read_back():
    """
    Verifies that telemetry read-back queries physical simulator equations
    and produces post-action telemetry (power, temp, co2, occupancy, hvac_state, lighting_state).
    """
    sim = NexoraBuildingSimulator()
    executor = SimulatedBMSControlExecutor(simulator=sim)

    # Execute action
    rec = {
        "recommendation_id": "rec-z04-rb",
        "zone_id": "Z04-CSB",
        "id": "z04",
        "action": "HVAC_SETBACK_LIGHTING_DIM",
        "target_setpoint_c": 24.5,
        "lighting_level_pct": 15.0,
        "hvac_mode": "SETBACK",
        "fan_speed": "LOW",
        "safety_gate_passed": True,
    }
    executor.execute_action(rec, is_human_approved=True)

    # Perform read-back
    readback = executor.read_back("Z04-CSB", current_time=datetime(2026, 10, 5, 14, 30))

    assert readback["zone_id"] == "Z04-CSB"
    assert readback["evidence"] == "SIMULATED"
    assert "power_kw" in readback
    assert "temperature_c" in readback
    assert "co2_ppm" in readback
    assert readback["occupancy"] == 0
    assert readback["hvac_mode"] == "SETBACK"
    assert readback["lighting_pct"] == 15.0
    assert readback["power_kw"] < 3.0  # Physically lower than 5.6 kW pre-action load


def test_mv_calculation_impact_formula():
    """
    Verifies M&V calculation: Impact = Adjusted Baseline - Actual.
    Verifies avoided_kw, avoided_kwh, and cost_saved_inr.
    """
    mv = MVEngine(commercial_tariff_inr_per_kwh=9.5)
    before_tel = {"power_kw": 5.60, "temperature_c": 21.2, "co2_ppm": 440.0}
    after_tel = {"power_kw": 3.69, "temperature_c": 21.8, "co2_ppm": 435.0}

    record = mv.verify_intervention(
        recommendation_id="rec-001",
        zone_id="Z04-CSB",
        action="HVAC_SETBACK_LIGHTING_DIM",
        before_telemetry=before_tel,
        after_telemetry=after_tel,
        expected_baseline_kw=1.51,
        duration_hours=0.75,
    )

    assert record.avoided_kw == 1.91
    assert record.avoided_kwh == round(1.91 * 0.75, 2)
    assert record.cost_saved_inr == round(record.avoided_kwh * 9.5, 2)
    assert record.verification_status == "VERIFIED"


def test_comfort_preservation_validation():
    """Verifies that comfort check passes inside [21.5, 25.5] band and fails outside."""
    mv = MVEngine()
    cfg = ZONES["z04"]

    # Passing: 22.0°C is within [21.5, 25.5]
    pass_rec = mv.verify_intervention(
        recommendation_id="rec-pass",
        zone_id="Z04-CSB",
        action="HVAC_SETBACK",
        before_telemetry={"power_kw": 5.60, "temperature_c": 21.2, "co2_ppm": 440.0},
        after_telemetry={"power_kw": 3.60, "temperature_c": 22.0, "co2_ppm": 440.0},
        expected_baseline_kw=1.51,
    )
    assert pass_rec.comfort_pass is True

    # Failing: 26.5°C exceeds max_temp (25.5°C)
    fail_rec = mv.verify_intervention(
        recommendation_id="rec-fail",
        zone_id="Z04-CSB",
        action="HVAC_SETBACK",
        before_telemetry={"power_kw": 5.60, "temperature_c": 21.2, "co2_ppm": 440.0},
        after_telemetry={"power_kw": 2.00, "temperature_c": 26.5, "co2_ppm": 440.0},
        expected_baseline_kw=1.51,
    )
    assert fail_rec.comfort_pass is False
    assert fail_rec.verification_status == "NOT_VERIFIED"


def test_iaq_preservation_validation():
    """Verifies that IAQ check passes when CO2 <= 950 ppm and fails when > 950 ppm."""
    mv = MVEngine()

    # Passing: 450 ppm <= 950 ppm limit
    pass_rec = mv.verify_intervention(
        recommendation_id="rec-iaq-pass",
        zone_id="Z04-CSB",
        action="HVAC_SETBACK",
        before_telemetry={"power_kw": 5.60, "temperature_c": 21.2, "co2_ppm": 440.0},
        after_telemetry={"power_kw": 3.60, "temperature_c": 22.0, "co2_ppm": 450.0},
        expected_baseline_kw=1.51,
    )
    assert pass_rec.iaq_pass is True

    # Failing: 1100 ppm exceeds 950 ppm limit
    fail_rec = mv.verify_intervention(
        recommendation_id="rec-iaq-fail",
        zone_id="Z04-CSB",
        action="HVAC_SETBACK",
        before_telemetry={"power_kw": 5.60, "temperature_c": 21.2, "co2_ppm": 440.0},
        after_telemetry={"power_kw": 3.60, "temperature_c": 22.0, "co2_ppm": 1100.0},
        expected_baseline_kw=1.51,
    )
    assert fail_rec.iaq_pass is False
    assert fail_rec.verification_status == "NOT_VERIFIED"


def test_verification_status_not_verified_on_no_savings():
    """Verifies that an intervention with no power drop is marked NOT_VERIFIED."""
    mv = MVEngine()
    record = mv.verify_intervention(
        recommendation_id="rec-no-savings",
        zone_id="Z04-CSB",
        action="HVAC_SETBACK",
        before_telemetry={"power_kw": 3.00, "temperature_c": 21.5, "co2_ppm": 440.0},
        after_telemetry={"power_kw": 3.20, "temperature_c": 21.5, "co2_ppm": 440.0},
        expected_baseline_kw=1.51,
    )
    assert record.verification_status == "NOT_VERIFIED"
    assert record.avoided_kw == 0.0


def test_zone04_complete_closed_loop_flow():
    """
    Demonstrates the complete end-to-end NEXORA closed loop on Zone 04:
    DETECT -> RECOMMEND -> APPROVE -> ACT -> READ-BACK -> VERIFY
    """
    # 1. SENSE & DETECT: Verify Conference Suite B is in early vacancy anomaly
    zones_res = client.get("/zones/Z04-CSB/state")
    assert zones_res.status_code == 200
    z04_initial = zones_res.json()
    assert z04_initial["occupancy"] == 0
    assert z04_initial["power_kw"] == 5.60
    assert z04_initial["target_setpoint_c"] == 21.0
    assert z04_initial["has_anomaly"] is True

    # 2. RECOMMEND & GATE: Verify recommendation generated with 5/5 safety checks
    recs_res = client.get("/recommendations")
    assert recs_res.status_code == 200
    rec = next(r for r in recs_res.json() if r["zone_id"] == "Z04-CSB")
    assert rec["status"] == "PENDING_APPROVAL"
    assert rec["action"] == "HVAC_SETBACK_LIGHTING_DIM"
    assert rec["safety_checks"]["passed"] == 5

    # 3. APPROVE & ACT & READ-BACK: FM approves intervention
    rec_id = rec["recommendation_id"]
    approve_res = client.post(f"/actions/{rec_id}/approve")
    assert approve_res.status_code == 200
    approval_data = approve_res.json()

    assert approval_data["status"] == "APPROVED"
    assert approval_data["action"] == "HVAC_SETBACK_LIGHTING_DIM"

    # Before telemetry check
    assert approval_data["before_telemetry"]["total_power_kw"] == 5.60
    assert approval_data["before_telemetry"]["target_setpoint_c"] == 21.0
    assert approval_data["before_telemetry"]["lighting_pct"] == 100.0

    # After telemetry read-back check
    assert approval_data["after_telemetry"]["target_setpoint_c"] == 24.5
    assert approval_data["after_telemetry"]["lighting_pct"] == 15.0
    assert approval_data["after_telemetry"]["total_power_kw"] < 5.60

    # 4. VERIFY: Physical verification audit
    ver = approval_data["verification"]
    assert ver["status"] == "VERIFIED"
    assert ver["comfort_preserved"] is True
    assert ver["iaq_preserved"] is True
    assert approval_data["actual_impact"]["actual_load_reduction_kw"] > 1.5

    # 5. AUDIT LEDGER: Check that /impact includes this verified record
    impact_res = client.get("/impact")
    assert impact_res.status_code == 200
    impact = impact_res.json()

    assert impact["interventions_count"] == 1
    assert impact["total_verified_load_reduction_kw"] > 1.5
    assert impact["total_avoided_energy_kwh"] > 0
    assert impact["total_cost_savings_inr"] > 0
    assert impact["verification_records"][0]["status"] == "VERIFIED"
    assert impact["evidence"] == "SIMULATED"
