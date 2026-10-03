"""
NEXORA Peak Event / Demand Response Simulation Tests
Validates:
1. Peak event creation
2. Target limit handling
3. Flexible zone selection
4. Critical zone protection (Server Room Z07-SRU never curtailed)
5. Safety gate enforcement
6. Action execution
7. Telemetry read-back
8. Peak reduction calculation
9. Comfort preservation (ASHRAE 55)
10. IAQ preservation (ASHRAE 62.1)
11. Stopping an active event
12. Strict evidence discipline (evidence="SIMULATED")
"""

from datetime import datetime
import pytest

from backend.simulation.peak_event import PeakEventManager, PeakEventRecord
from backend.simulator.config import ZONES


@pytest.fixture
def peak_manager():
    """Provides a fresh PeakEventManager for testing."""
    return PeakEventManager()


def test_peak_event_creation(peak_manager):
    """Verifies peak event instantiation and initial active state."""
    res = peak_manager.trigger_peak_event(
        duration_minutes=120,
        target_limit_kw=60.0,
        scenario_id="summer_peak",
    )

    assert isinstance(res, PeakEventRecord)
    assert res.event_id.startswith("pe-")
    assert res.status == "ACTIVE"
    assert res.target_limit_kw == 60.0
    assert res.evidence == "SIMULATED"
    assert res.started_at is not None
    assert res.duration_minutes == 120

    data = res.to_dict()
    assert data["event_id"] == res.event_id
    assert data["status"] == "ACTIVE"
    assert data["target_limit_kw"] == 60.0
    assert data["evidence"] == "SIMULATED"


def test_target_limit_handling(peak_manager):
    """Verifies target limit configuration and capacity utilization calculation."""
    # Custom limit 45.0 kW
    res_45 = peak_manager.trigger_peak_event(
        duration_minutes=60,
        target_limit_kw=45.0,
        scenario_id="summer_peak",
    )
    assert res_45.target_limit_kw == 45.0
    expected_utilization = round((res_45.baseline_peak_kw / 45.0) * 100.0, 1)
    assert res_45.utilization_pct == expected_utilization

    # Custom limit 70.0 kW
    res_70 = peak_manager.trigger_peak_event(
        duration_minutes=90,
        target_limit_kw=70.0,
        scenario_id="summer_peak",
    )
    assert res_70.target_limit_kw == 70.0
    assert res_70.baseline_peak_kw > 0.0


def test_flexible_zone_selection(peak_manager):
    """Verifies that non-critical office zones are identified for demand response."""
    res = peak_manager.trigger_peak_event(
        duration_minutes=120,
        target_limit_kw=60.0,
    )

    # Check that participating zones come from the flexible set
    flexible_codes = {ZONES[zid].code for zid in ZONES if zid != "z07"}
    for pz in res.participating_zones:
        assert pz in flexible_codes

    assert len(res.participating_zones) > 0
    # Core flexible zones like South Open Workspace and North Engineering Lab should participate
    assert "Z01-SOW" in res.participating_zones
    assert "Z02-NEL" in res.participating_zones


def test_critical_zone_protection(peak_manager):
    """Verifies that Tier 1 Server Room (Z07-SRU) is protected and NEVER curtailed."""
    res = peak_manager.trigger_peak_event(
        duration_minutes=120,
        target_limit_kw=60.0,
    )

    # 1. Server room must be explicitly registered in protected_zones
    assert ZONES["z07"].code in res.protected_zones
    assert "Z07-SRU" in res.protected_zones

    # 2. Server room must NEVER appear in participating_zones
    assert "Z07-SRU" not in res.participating_zones
    assert "z07" not in res.participating_zones

    # 3. Server room must NEVER have an executed setback action
    for act in res.actions_executed:
        assert act["zone_id"] != "Z07-SRU"
        assert act["zone_id"] != "z07"

    # 4. Physical simulator setpoint for z07 must remain at base setpoint (19.5°C)
    z07_state = peak_manager.simulator.zone_states["z07"]
    assert z07_state["target_setpoint"] == ZONES["z07"].base_setpoint
    assert z07_state["fan_speed"] == "HIGH"


def test_safety_gate_enforcement(peak_manager):
    """Verifies that every dispatched action strictly passed all safety gate checks."""
    res = peak_manager.trigger_peak_event(
        duration_minutes=120,
        target_limit_kw=60.0,
    )

    assert len(res.actions_executed) > 0
    for act in res.actions_executed:
        assert act["safety_passed"] is True
        assert act["status"] == "EXECUTED"
        # Setpoint cannot exceed comfort band upper limit
        cfg = next(c for c in ZONES.values() if c.code == act["zone_id"])
        assert act["target_setpoint_c"] <= cfg.comfort_band.max_temp


def test_action_execution_updates_simulator(peak_manager):
    """Verifies that approved actions directly update the physical simulator actuators."""
    res = peak_manager.trigger_peak_event(
        duration_minutes=120,
        target_limit_kw=60.0,
    )

    # Zone 01 (South Open Workspace)
    z01_act = next((a for a in res.actions_executed if a["zone_id"] == "Z01-SOW"), None)
    assert z01_act is not None
    assert z01_act["action"] in ("HVAC_SETBACK_LIGHTING_DIM", "HVAC_SETBACK")

    # Inspect simulator internal state
    z01_sim = peak_manager.simulator.zone_states["z01"]
    assert z01_sim["target_setpoint"] == z01_act["target_setpoint_c"]
    assert z01_sim["manual_override"] is True
    if "DIM" in z01_act["action"]:
        assert z01_sim["lighting_pct"] == 15.0


def test_telemetry_read_back(peak_manager):
    """Verifies that power numbers are read back from simulator equations, not fabricated."""
    res = peak_manager.trigger_peak_event(
        duration_minutes=120,
        target_limit_kw=60.0,
    )

    assert res.baseline_peak_kw > 0.0
    assert res.current_peak_kw > 0.0
    # Curtailment must physically reduce building power
    assert res.current_peak_kw < res.baseline_peak_kw


def test_peak_reduction_calculation(peak_manager):
    """Verifies mathematical correctness of peak_reduction_kw."""
    res = peak_manager.trigger_peak_event(
        duration_minutes=120,
        target_limit_kw=60.0,
    )

    expected_reduction = round(res.baseline_peak_kw - res.current_peak_kw, 2)
    assert res.peak_reduction_kw == expected_reduction
    assert res.peak_reduction_kw > 5.0  # Multi-zone curtailment yields meaningful reduction


def test_comfort_preservation(peak_manager):
    """Verifies that temperature remains within ASHRAE 55 comfort bounds."""
    res = peak_manager.trigger_peak_event(
        duration_minutes=120,
        target_limit_kw=60.0,
    )

    assert res.comfort_pass is True

    # Check each participating zone's temperature
    readback_snap = peak_manager.simulator.step(
        dt=datetime(2026, 10, 5, 14, 30),
        dt_hours=0.25,
        inject_anomalies=False,
    )
    for zid, cfg in ZONES.items():
        if cfg.code in res.participating_zones:
            temp = readback_snap.zones[zid].temperature_c
            # Must not exceed upper comfort bound
            assert temp <= cfg.comfort_band.max_temp + 0.5


def test_iaq_preservation(peak_manager):
    """Verifies that indoor CO2 concentrations remain within ASHRAE 62.1 boundaries."""
    res = peak_manager.trigger_peak_event(
        duration_minutes=120,
        target_limit_kw=60.0,
    )

    assert res.iaq_pass is True

    readback_snap = peak_manager.simulator.step(
        dt=datetime(2026, 10, 5, 14, 30),
        dt_hours=0.25,
        inject_anomalies=False,
    )
    for zid, cfg in ZONES.items():
        if cfg.code in res.participating_zones:
            co2 = readback_snap.zones[zid].co2_ppm
            assert co2 <= cfg.comfort_band.max_co2


def test_stopping_active_event(peak_manager):
    """Verifies stopping an active peak event restores baseline thermostat setpoints."""
    # 1. Trigger event
    active_res = peak_manager.trigger_peak_event(
        duration_minutes=120,
        target_limit_kw=60.0,
    )
    assert active_res.status == "ACTIVE"

    # Verify setback setpoint was applied in z01
    assert peak_manager.simulator.zone_states["z01"]["target_setpoint"] == 24.5

    # 2. Stop event
    stopped_res = peak_manager.stop_peak_event()
    assert stopped_res.status == "STOPPED"
    assert stopped_res.ended_at is not None
    assert stopped_res.peak_reduction_kw == 0.0

    # 3. Verify simulator restored z01 to base setpoint (22.5°C) and cleared manual override
    z01_restored = peak_manager.simulator.zone_states["z01"]
    assert z01_restored["target_setpoint"] == ZONES["z01"].base_setpoint
    assert z01_restored["manual_override"] is False
