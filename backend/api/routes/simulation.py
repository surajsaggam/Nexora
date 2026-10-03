"""
NEXORA Building Intelligence Platform - Simulation Control Endpoints
POST /sim/peak-event
POST /sim/reset
GET  /sim/scenarios
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body

from backend.api.schemas import SimulationEventRequest, SimulationEventResponse
from backend.api.state import service
from backend.simulator.config import SCENARIOS

router = APIRouter(tags=["Simulation Control"])


@router.post(
    "/sim/peak-event",
    response_model=SimulationEventResponse,
    summary="Trigger building peak event or early-vacancy scenario",
)
def trigger_peak_event(
    payload: Optional[SimulationEventRequest] = Body(default=None),
) -> SimulationEventResponse:
    """
    Triggers or re-arms the canonical NEXORA demonstration scenario:
    - Sets simulation clock to Monday 14:15.
    - Injects the Conference Suite B (Z04-CSB) early vacation anomaly.
    - Runs the ML intelligence layer & Decision Engine to generate the fresh recommendation.
    - Allows full closed-loop flow demonstration on demand.
    """
    scenario_id = payload.scenario_id if payload and payload.scenario_id else "suite_b_early_vacancy"
    target_zone = payload.zone_id if payload and payload.zone_id else "z04"
    res = service.trigger_peak_event(
        scenario_id=scenario_id,
        target_zone=target_zone,
        timestamp_iso=payload.timestamp_iso if payload else None,
    )
    return SimulationEventResponse(**res)


@router.post(
    "/sim/reset",
    summary="Reset simulation back to baseline initial state",
)
def reset_simulation() -> Dict[str, Any]:
    """Resets simulator and recommendations back to initial Monday 14:15 baseline."""
    service.reset_to_suite_b_baseline()
    return {
        "status": "RESET_SUCCESSFUL",
        "timestamp": service.current_time.isoformat(),
        "active_recommendations": len(service.recommendations),
        "evidence": "SIMULATED",
    }


@router.get(
    "/sim/scenarios",
    summary="List available simulation scenarios",
)
def list_scenarios() -> List[Dict[str, Any]]:
    """Lists configured simulation scenarios from backend/simulator/config.py."""
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "outdoor_base_temp": s.outdoor_base_temp,
            "outdoor_peak_temp": s.outdoor_peak_temp,
            "grid_stress": s.grid_stress,
            "evidence": "SIMULATED",
        }
        for s in SCENARIOS.values()
    ]
