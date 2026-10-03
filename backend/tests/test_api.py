"""
NEXORA Building Intelligence Platform - FastAPI Integration Layer Test Suite
Comprehensive tests covering:
- GET  /health
- GET  /zones
- GET  /zones/{zone_id}/state
- GET  /recommendations
- POST /actions/{recommendation_id}/approve
- POST /actions/{recommendation_id}/reject
- Invalid recommendation ID error handling (404)
- Safety-gate rejection enforcement (400)
- GET  /impact (M&V verification summary)
- POST /sim/peak-event (scenario trigger)
"""

from fastapi.testclient import TestClient
import pytest

from backend.api.main import app
from backend.api.state import service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_service_baseline():
    """Ensures each test starts with a clean Suite B baseline."""
    service.reset_to_suite_b_baseline()


def test_health_endpoint():
    """Verifies service health, subsystem readiness, and simulated provenance."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "HEALTHY"
    assert data["service"] == "NEXORA Building Intelligence API"
    assert data["version"] == "1.0.0"
    assert data["components"]["simulator"] == "ONLINE"
    assert data["components"]["ml_service"] == "ONLINE"
    assert data["components"]["decision_engine"] == "ONLINE"
    assert data["evidence"] == "SIMULATED"
    assert "timestamp" in data


def test_zones_endpoint():
    """Verifies all 8 zones returned with required frontend summary schema."""
    response = client.get("/zones")
    assert response.status_code == 200
    zones = response.json()

    assert isinstance(zones, list)
    assert len(zones) == 8

    # Verify presence of all expected zone codes
    zone_codes = {z["zone_id"] for z in zones}
    expected_codes = {
        "Z01-SOW", "Z02-NEL", "Z03-EBR", "Z04-CSB",
        "Z05-CCA", "Z06-CBL", "Z07-SRU", "Z08-EFR",
    }
    assert expected_codes.issubset(zone_codes)

    # Check Zone 04 Conference Suite B summary fields
    z04 = next(z for z in zones if z["zone_id"] == "Z04-CSB")
    assert z04["name"] == "Conference Suite B"
    assert z04["occupancy"] == 0
    assert z04["temperature_c"] == 21.2
    assert z04["co2_ppm"] == 440.0
    assert z04["power_kw"] == 5.60
    assert z04["evidence"] == "SIMULATED"


def test_zone04_state_and_flex_lookup():
    """Verifies detailed telemetry retrieval via code ('Z04-CSB') and key ('z04')."""
    # Lookup by official code
    res_code = client.get("/zones/Z04-CSB/state")
    assert res_code.status_code == 200
    data_code = res_code.json()

    assert data_code["zone_id"] == "Z04-CSB"
    assert data_code["code"] == "Z04-CSB"
    assert data_code["id"] == "z04"
    assert data_code["name"] == "Conference Suite B"
    assert data_code["occupancy"] == 0
    assert data_code["temperature_c"] == 21.2
    assert data_code["target_setpoint_c"] == 21.0
    assert data_code["power_kw"] == 5.60
    assert data_code["has_anomaly"] is True
    assert "Meeting vacated early" in data_code["anomaly_description"]
    assert data_code["evidence"] == "SIMULATED"

    # Verify comfort band boundary
    comfort = data_code["comfort_band"]
    assert comfort["min_temp"] == 21.5
    assert comfort["max_temp"] == 25.5
    assert comfort["max_co2"] == 950.0

    # Lookup by lowercase key
    res_key = client.get("/zones/z04/state")
    assert res_key.status_code == 200
    assert res_key.json()["zone_id"] == "Z04-CSB"


def test_zone_state_not_found():
    """Verifies 404 error returned for unknown zone ID."""
    response = client.get("/zones/INVALID-ZONE-99/state")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_recommendations_endpoint():
    """Verifies ML-generated, safety-gated recommendations for Zone 04."""
    response = client.get("/recommendations")
    assert response.status_code == 200
    recs = response.json()

    assert isinstance(recs, list)
    assert len(recs) >= 1

    rec = next(r for r in recs if r["zone_id"] == "Z04-CSB")
    assert rec["recommendation_id"].startswith("rec-z04-")
    assert rec["status"] == "PENDING_APPROVAL"
    assert rec["action"] == "HVAC_SETBACK_LIGHTING_DIM"
    assert rec["predicted_load_reduction_kw"] == 1.91
    assert rec["safety_checks"]["passed"] == 5
    assert rec["safety_checks"]["total"] == 5
    assert rec["confidence"] >= 85.0
    assert rec["evidence"] == "SIMULATED"


def test_approve_action_flow():
    """
    Verifies full closed-loop HITL approval flow:
    BEFORE -> ACTION -> AFTER -> VERIFIED IMPACT
    """
    # 1. Fetch current pending recommendation
    recs_res = client.get("/recommendations")
    assert recs_res.status_code == 200
    rec = next(r for r in recs_res.json() if r["zone_id"] == "Z04-CSB")
    rec_id = rec["recommendation_id"]

    # 2. Approve recommendation
    approve_res = client.post(f"/actions/{rec_id}/approve")
    assert approve_res.status_code == 200
    data = approve_res.json()

    assert data["recommendation_id"] == rec_id
    assert data["zone_id"] == "Z04-CSB"
    assert data["status"] == "APPROVED"
    assert data["action"] == "HVAC_SETBACK_LIGHTING_DIM"

    # Telemetry before
    before = data["before_telemetry"]
    assert before["temperature_c"] == 21.2
    assert before["target_setpoint_c"] == 21.0
    assert before["lighting_pct"] == 100.0
    assert before["total_power_kw"] == 5.60
    assert before["evidence"] == "SIMULATED"

    # Telemetry after
    after = data["after_telemetry"]
    assert after["target_setpoint_c"] == 24.5
    assert after["lighting_pct"] == 15.0
    assert after["total_power_kw"] < before["total_power_kw"]
    assert after["evidence"] == "SIMULATED"

    # Quantitative impact
    actual_imp = data["actual_impact"]
    assert actual_imp["actual_load_reduction_kw"] > 1.5
    assert actual_imp["avoided_energy_kwh"] > 0
    assert actual_imp["actual_cost_savings_inr"] > 0
    assert actual_imp["evidence"] == "SIMULATED"

    # Verification status
    ver = data["verification"]
    assert ver["status"] == "VERIFIED"
    assert ver["comfort_preserved"] is True
    assert ver["iaq_preserved"] is True
    assert ver["evidence"] == "SIMULATED"

    # 3. Verify recommendation status updated in store
    rec_check = client.get(f"/recommendations/{rec_id}")
    assert rec_check.status_code == 200
    assert rec_check.json()["status"] == "APPROVED"

    # 4. Verify cannot approve twice
    duplicate_res = client.post(f"/actions/{rec_id}/approve")
    assert duplicate_res.status_code == 400
    assert "cannot be approved" in duplicate_res.json()["detail"].lower()


def test_reject_action_flow():
    """
    Verifies HITL rejection flow:
    - Does NOT modify building state.
    - Records rejection.
    - Returns clear status.
    """
    recs_res = client.get("/recommendations")
    rec = next(r for r in recs_res.json() if r["zone_id"] == "Z04-CSB")
    rec_id = rec["recommendation_id"]

    # Reject recommendation
    reject_res = client.post(
        f"/actions/{rec_id}/reject",
        json={"reason": "Board meeting rescheduled early; keeping room pre-conditioned"},
    )
    assert reject_res.status_code == 200
    data = reject_res.json()

    assert data["recommendation_id"] == rec_id
    assert data["status"] == "REJECTED"
    assert data["building_state_modified"] is False
    assert "Board meeting rescheduled early" in data["reason"]
    assert data["evidence"] == "SIMULATED"

    # Building state in Zone 04 must remain unchanged (5.60 kW, setpoint 21.0°C)
    z04_check = client.get("/zones/Z04-CSB/state")
    assert z04_check.status_code == 200
    assert z04_check.json()["target_setpoint_c"] == 21.0
    assert z04_check.json()["power_kw"] == 5.60

    # Cannot reject again
    duplicate_reject = client.post(f"/actions/{rec_id}/reject")
    assert duplicate_reject.status_code == 400


def test_invalid_recommendation_handling():
    """Verifies 404 responses for non-existent recommendations."""
    bad_id = "rec-nonexistent-999999"

    approve_bad = client.post(f"/actions/{bad_id}/approve")
    assert approve_bad.status_code == 404
    assert "not found" in approve_bad.json()["detail"].lower()

    reject_bad = client.post(f"/actions/{bad_id}/reject")
    assert reject_bad.status_code == 404
    assert "not found" in reject_bad.json()["detail"].lower()

    get_bad = client.get(f"/recommendations/{bad_id}")
    assert get_bad.status_code == 404
    assert "not found" in get_bad.json()["detail"].lower()


def test_safety_gate_rejection():
    """
    Verifies that actions failing safety-gate checks CANNOT be approved.
    Simulates an unsafe setback command for the mission-critical Server Room (Z07-SRU).
    """
    unsafe_rec = service.create_unsafe_recommendation_for_testing()
    unsafe_id = unsafe_rec["recommendation_id"]

    # Verify it failed the safety gate
    assert unsafe_rec["safety_gate_passed"] is False

    # Attempt to approve unsafe action
    approve_res = client.post(f"/actions/{unsafe_id}/approve")
    assert approve_res.status_code == 400
    error_detail = approve_res.json()["detail"]

    assert "safety gate rejection" in error_detail.lower()
    assert "cannot be approved" in error_detail.lower()

    # Verify recommendation status was NOT changed to APPROVED
    rec_check = client.get(f"/recommendations/{unsafe_id}")
    assert rec_check.status_code == 200
    assert rec_check.json()["status"] == "PENDING_APPROVAL"


def test_impact_endpoint():
    """Verifies cumulative M&V verification summary after an approved action."""
    # Initially no verified interventions
    initial_impact = client.get("/impact").json()
    assert initial_impact["interventions_count"] == 0
    assert initial_impact["evidence"] == "SIMULATED"

    # Approve Zone 04 recommendation
    rec = next(r for r in client.get("/recommendations").json() if r["zone_id"] == "Z04-CSB")
    client.post(f"/actions/{rec['recommendation_id']}/approve")

    # Fetch updated impact
    impact_res = client.get("/impact")
    assert impact_res.status_code == 200
    data = impact_res.json()

    assert data["interventions_count"] == 1
    assert data["total_verified_load_reduction_kw"] > 1.5
    assert data["total_avoided_energy_kwh"] > 0
    assert data["total_cost_savings_inr"] > 0
    assert data["comfort_compliance_pct"] >= 80.0
    assert data["iaq_compliance_pct"] >= 90.0
    assert data["evidence"] == "SIMULATED"

    records = data["verification_records"]
    assert len(records) == 1
    assert records[0]["zone_id"] == "Z04-CSB"
    assert records[0]["status"] == "VERIFIED"
    assert records[0]["evidence"] == "SIMULATED"


def test_peak_event_endpoint():
    """Verifies re-arming and triggering the Conference Suite B early vacancy event."""
    # First approve or alter state
    rec = next(r for r in client.get("/recommendations").json() if r["zone_id"] == "Z04-CSB")
    client.post(f"/actions/{rec['recommendation_id']}/approve")

    # Trigger peak event to re-arm scenario
    event_res = client.post(
        "/sim/peak-event",
        json={"scenario_id": "suite_b_early_vacancy", "zone_id": "z04"},
    )
    assert event_res.status_code == 200
    data = event_res.json()

    assert data["event"] == "PEAK_EVENT_TRIGGERED"
    assert data["scenario"] == "suite_b_early_vacancy"
    assert data["target_zone"] == "Z04-CSB"
    assert data["current_power_kw"] == 5.60
    assert data["evidence"] == "SIMULATED"
    assert data["recommendation_id"] is not None

    # Check recommendations list has the fresh pending recommendation
    recs = client.get("/recommendations").json()
    assert len(recs) >= 1
    fresh_rec = next(r for r in recs if r["zone_id"] == "Z04-CSB")
    assert fresh_rec["status"] == "PENDING_APPROVAL"


def test_cors_middleware_headers():
    """Verifies CORS headers allow Next.js local frontend communication."""
    response = client.options(
        "/zones",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") in ["http://localhost:3000", "*"]
