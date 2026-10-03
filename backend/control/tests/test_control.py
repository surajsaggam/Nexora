"""
NEXORA Control Layer - Unit Tests
Verifies:
1. Valid control execution (HVAC_SETBACK, HVAC_SETBACK_LIGHTING_DIM, NO_ACTION)
2. Rejection of unauthorized control actions
3. Rejection of unsupported control actions
4. Safety-gate failure preventing execution
5. Mission-critical zone (Server Room Z07-SRU) protection
6. Simulator state actuation and manual_override updates
7. Post-action physical telemetry read-back from simulator
"""

from datetime import datetime
import pytest

from backend.control.executor import (
    SimulatedBMSControlExecutor,
)
from backend.control.state import (
    BMSControlStateTracker,
    ControlExecutionResult,
    SUPPORTED_ACTIONS,
)
from backend.simulator.config import ZONES
from backend.simulator.engine import NexoraBuildingSimulator


@pytest.fixture
def simulator():
    sim = NexoraBuildingSimulator(scenario_id="standard")
    sim.reset_state()
    return sim


@pytest.fixture
def executor(simulator):
    tracker = BMSControlStateTracker()
    return SimulatedBMSControlExecutor(simulator=simulator, state_tracker=tracker)


def test_supported_actions_membership():
    """Verifies defined discrete actions set."""
    assert "NO_ACTION" in SUPPORTED_ACTIONS
    assert "HVAC_SETBACK" in SUPPORTED_ACTIONS
    assert "HVAC_SETBACK_LIGHTING_DIM" in SUPPORTED_ACTIONS
    assert len(SUPPORTED_ACTIONS) == 3


def test_valid_control_execution_setback_and_dim(executor, simulator):
    """Verifies valid HVAC setback and lighting dimming execution on Zone 04."""
    rec = {
        "recommendation_id": "rec-z04-test",
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
    assert res.authorized is True

    # Verify simulator state actually updated
    z04_st = simulator.zone_states["z04"]
    assert z04_st["target_setpoint"] == 24.5
    assert z04_st["lighting_pct"] == 15.0
    assert z04_st["hvac_mode"] == "SETBACK"
    assert z04_st["fan_speed"] == "LOW"
    assert z04_st["manual_override"] is True


def test_valid_control_execution_no_action(executor, simulator):
    """Verifies NO_ACTION maintains status quo without altering setpoint."""
    initial_setpoint = simulator.zone_states["z04"]["target_setpoint"]
    rec = {
        "recommendation_id": "rec-z04-no-action",
        "zone_id": "Z04-CSB",
        "id": "z04",
        "action": "NO_ACTION",
        "safety_gate_passed": True,
    }

    res = executor.execute_action(rec, is_human_approved=True)

    assert res.status == "EXECUTED"
    assert res.action == "NO_ACTION"
    assert res.setpoint_c == initial_setpoint
    assert simulator.zone_states["z04"]["target_setpoint"] == initial_setpoint


def test_unauthorized_action_rejection(executor):
    """Verifies that an actuation without verified human approval is rejected."""
    rec = {
        "recommendation_id": "rec-z04-unauthorized",
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


def test_unsupported_action_rejection(executor):
    """Verifies rejection of undefined action commands."""
    rec = {
        "recommendation_id": "rec-z04-invalid",
        "zone_id": "Z04-CSB",
        "id": "z04",
        "action": "CHILLER_TURBO_OVERDRIVE",
        "safety_gate_passed": True,
    }

    res = executor.execute_action(rec, is_human_approved=True)

    assert res.status == "REJECTED"
    assert "unsupported" in res.detail.lower()


def test_safety_gate_failure_prevents_execution(executor):
    """Verifies that recommendations that failed safety checks cannot be executed."""
    rec = {
        "recommendation_id": "rec-z04-unsafe",
        "zone_id": "Z04-CSB",
        "id": "z04",
        "action": "HVAC_SETBACK_LIGHTING_DIM",
        "safety_gate_passed": False,
        "rejection_reason": "Thermal comfort boundary violated",
    }

    res = executor.execute_action(rec, is_human_approved=True)

    assert res.status == "REJECTED"
    assert "safety gate" in res.detail.lower()


def test_critical_server_room_setback_blocked(executor):
    """Verifies that automated setbacks on Tier 1 Server Room Z07-SRU are blocked."""
    rec = {
        "recommendation_id": "rec-z07-unsafe",
        "zone_id": "Z07-SRU",
        "id": "z07",
        "action": "HVAC_SETBACK",
        "target_setpoint_c": 26.0,
        "safety_gate_passed": True,
    }

    res = executor.execute_action(rec, is_human_approved=True)

    assert res.status == "REJECTED"
    assert "mission critical" in res.detail.lower()


def test_telemetry_read_back_directly_from_simulator(executor, simulator):
    """
    Verifies that telemetry read-back queries the actual simulator physics equations
    and does NOT merely return predicted values.
    """
    # 1. Apply setback
    rec = {
        "recommendation_id": "rec-z04-readback",
        "zone_id": "Z04-CSB",
        "id": "z04",
        "action": "HVAC_SETBACK_LIGHTING_DIM",
        "target_setpoint_c": 24.5,
        "lighting_level_pct": 15.0,
        "hvac_mode": "SETBACK",
        "fan_speed": "LOW",
        "safety_gate_passed": True,
    }
    exec_res = executor.execute_action(rec, is_human_approved=True)
    assert exec_res.status == "EXECUTED"

    # 2. Query read-back
    dt = datetime(2026, 10, 5, 14, 30)
    readback = executor.read_back("Z04-CSB", current_time=dt)

    assert readback["zone_id"] == "Z04-CSB"
    assert readback["evidence"] == "SIMULATED"
    assert "power_kw" in readback
    assert "temperature_c" in readback
    assert "co2_ppm" in readback
    assert readback["occupancy"] == 0
    assert readback["hvac_mode"] == "SETBACK"
    assert readback["lighting_pct"] == 15.0
    assert readback["power_kw"] < 3.0  # Physically reduced from the 5.60 kW anomaly load
