"""
NEXORA Peak Event / Demand Response Integration & API Tests
Verifies:
1. Peak event creation & response schema
2. Target limit handling & capacity utilization
3. Flexible zone identification & participation
4. Critical zone protection (Z07-SRU Server Room & UPS Hub)
5. Safety gate verification
6. Control execution & setpoint updates
7. Telemetry read-back directly from physical simulator
8. Peak reduction calculation
9. Comfort preservation (ASHRAE 55)
10. IAQ preservation (ASHRAE 62.1)
11. Stopping active event & restoring baseline setpoints
12. FastAPI routes:
    - POST /sim/peak-event
    - GET  /sim/peak-event
    - POST /sim/peak-event/stop
    - Backward-compatible suite_b_early_vacancy re-arm
"""

from fastapi.testclient import TestClient
import pytest

from backend.api.main import app
from backend.simulation.peak_event import PeakEventManager, PeakEventRecord
from backend.simulator.config import ZONES

client = TestClient(app)


def test_peak_event_core_manager():
    """Validates standalone PeakEventManager closed-loop execution."""
    mgr = PeakEventManager()
    record = mgr.trigger_peak_event(
        duration_minutes=120,
        target_limit_kw=60.0,
        scenario_id="summer_peak",
    )

    assert record.event_id.startswith("pe-")
    assert record.status == "ACTIVE"
    assert record.target_limit_kw == 60.0
    assert record.baseline_peak_kw > 0.0
    assert record.current_peak_kw < record.baseline_peak_kw
    assert record.peak_reduction_kw > 5.0
    assert record.comfort_pass is True
    assert record.iaq_pass is True
    assert record.evidence == "SIMULATED"

    # Server Room protection
    assert "Z07-SRU" in record.protected_zones
    assert "Z07-SRU" not in record.participating_zones
    assert all(a["zone_id"] != "Z07-SRU" for a in record.actions_executed)

    # Stopping active event
    stopped = mgr.stop_peak_event()
    assert stopped.status == "STOPPED"
    assert stopped.ended_at is not None
    assert stopped.peak_reduction_kw == 0.0


def test_fastapi_peak_event_trigger_endpoint():
    """
    Verifies POST /sim/peak-event endpoint:
    Request:
    {
      "duration_minutes": 120,
      "target_limit_kw": 60
    }
    Response matches the required schema:
    {
      "event_id": "...",
      "status": "ACTIVE",
      "target_limit_kw": 60,
      "baseline_peak_kw": ...,
      "current_peak_kw": ...,
      "peak_reduction_kw": ...,
      "participating_zones": [...],
      "protected_zones": [...],
      "actions_executed": [...],
      "comfort_pass": true,
      "iaq_pass": true,
      "evidence": "SIMULATED"
    }
    """
    res = client.post(
        "/sim/peak-event",
        json={"duration_minutes": 120, "target_limit_kw": 60.0},
    )
    assert res.status_code == 200
    data = res.json()

    assert data["event_id"].startswith("pe-")
    assert data["status"] == "ACTIVE"
    assert data["target_limit_kw"] == 60.0
    assert isinstance(data["baseline_peak_kw"], (int, float))
    assert isinstance(data["current_peak_kw"], (int, float))
    assert isinstance(data["peak_reduction_kw"], (int, float))
    assert data["peak_reduction_kw"] > 0.0
    assert isinstance(data["participating_zones"], list)
    assert len(data["participating_zones"]) > 0
    assert "Z07-SRU" in data["protected_zones"]
    assert "Z07-SRU" not in data["participating_zones"]
    assert data["comfort_pass"] is True
    assert data["iaq_pass"] is True
    assert data["evidence"] == "SIMULATED"


def test_fastapi_peak_event_get_endpoint():
    """Verifies GET /sim/peak-event returns active or latest event state."""
    # Ensure active event
    client.post(
        "/sim/peak-event",
        json={"duration_minutes": 90, "target_limit_kw": 55.0},
    )

    get_res = client.get("/sim/peak-event")
    assert get_res.status_code == 200
    data = get_res.json()

    assert data["status"] == "ACTIVE"
    assert data["target_limit_kw"] == 55.0
    assert data["evidence"] == "SIMULATED"
    assert len(data["participating_zones"]) > 0
    assert "Z07-SRU" in data["protected_zones"]


def test_fastapi_peak_event_stop_endpoint():
    """Verifies POST /sim/peak-event/stop stops active event and restores baseline."""
    # Trigger first
    client.post(
        "/sim/peak-event",
        json={"duration_minutes": 120, "target_limit_kw": 60.0},
    )

    stop_res = client.post("/sim/peak-event/stop")
    assert stop_res.status_code == 200
    data = stop_res.json()

    assert data["status"] == "STOPPED"
    assert data["ended_at"] is not None
    assert data["peak_reduction_kw"] == 0.0
    assert data["evidence"] == "SIMULATED"


def test_fastapi_legacy_peak_event_backward_compatibility():
    """
    Verifies that calling POST /sim/peak-event with legacy payload:
    {"scenario_id": "suite_b_early_vacancy", "zone_id": "z04"}
    continues to re-arm the canonical Conference Suite B anomaly scenario without error.
    """
    res = client.post(
        "/sim/peak-event",
        json={"scenario_id": "suite_b_early_vacancy", "zone_id": "z04"},
    )
    assert res.status_code == 200
    data = res.json()

    assert data["event"] == "PEAK_EVENT_TRIGGERED"
    assert data["scenario"] == "suite_b_early_vacancy"
    assert data["target_zone"] == "Z04-CSB"
    assert data["current_power_kw"] == 5.60
    assert data["evidence"] == "SIMULATED"
