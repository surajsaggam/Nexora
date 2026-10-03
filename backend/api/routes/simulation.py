"""
NEXORA Building Intelligence Platform - Simulation Control Endpoints
POST /sim/peak-event
GET  /sim/peak-event
POST /sim/peak-event/stop
POST /sim/reset
GET  /sim/scenarios
"""

from typing import Any, Dict, List, Optional, Union
from fastapi import APIRouter, Body

from backend.api.schemas import (
    PeakEventRequest,
    PeakEventResponse,
    SimulationEventRequest,
    SimulationEventResponse,
)
from backend.api.state import service
from backend.simulator.config import SCENARIOS

router = APIRouter(tags=["Simulation Control"])


@router.post(
    "/sim/peak-event",
    response_model=Union[PeakEventResponse, SimulationEventResponse],
    summary="Trigger building peak demand event or early-vacancy scenario",
)
def trigger_peak_event(
    payload: Optional[Dict[str, Any]] = Body(default=None),
) -> Union[PeakEventResponse, SimulationEventResponse]:
    """
    Triggers simulated peak-demand / demand response event or canonical Suite B early-vacancy scenario:
    - If payload has scenario_id == 'suite_b_early_vacancy': re-arms canonical demo scenario.
    - Otherwise: executes full closed-loop demand response event:
      Detect High Demand -> Identify Flexible Zones -> Generate Safe Actions ->
      Safety Gate -> Execute Approved Actions -> Read Back Telemetry -> Verify Peak Reduction.
    """
    # 1. Backward-compatible legacy check for Conference Suite B early departure scenario
    if payload and payload.get("scenario_id") == "suite_b_early_vacancy":
        target_zone = payload.get("zone_id", "z04")
        res = service.trigger_peak_event(
            scenario_id="suite_b_early_vacancy",
            target_zone=target_zone,
            timestamp_iso=payload.get("timestamp_iso"),
        )
        return SimulationEventResponse(**res)

    # 2. Closed-loop Peak Demand Response Event
    duration_minutes = 120
    target_limit_kw = 60.0
    scenario_id = "summer_peak"

    if payload:
        if "duration_minutes" in payload and payload["duration_minutes"] is not None:
            duration_minutes = int(payload["duration_minutes"])
        if "target_limit_kw" in payload and payload["target_limit_kw"] is not None:
            target_limit_kw = float(payload["target_limit_kw"])
        if "scenario_id" in payload and payload["scenario_id"]:
            scenario_id = str(payload["scenario_id"])

    record = service.trigger_peak_demand_event(
        duration_minutes=duration_minutes,
        target_limit_kw=target_limit_kw,
        scenario_id=scenario_id,
    )
    return PeakEventResponse(**record.to_dict())


@router.get(
    "/sim/peak-event",
    response_model=PeakEventResponse,
    summary="Get current or active peak demand response event state",
)
def get_peak_event() -> PeakEventResponse:
    """
    Returns active or latest peak demand response event status,
    including baseline vs current peak, reduction, and comfort/IAQ verification.
    """
    record = service.get_peak_demand_event()
    return PeakEventResponse(**record.to_dict())


@router.post(
    "/sim/peak-event/stop",
    response_model=PeakEventResponse,
    summary="Stop active peak demand response event and restore baseline setpoints",
)
def stop_peak_event() -> PeakEventResponse:
    """
    Stops an active peak demand response event:
    - Reverts all flexible zones back to baseline setpoints and lighting.
    - Steps physical simulator to read back restored power.
    - Returns updated event summary marked as STOPPED.
    """
    record = service.stop_peak_demand_event()
    return PeakEventResponse(**record.to_dict())


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
