"""
NEXORA Building Intelligence Platform - Action Approval & Dispatch Endpoints
POST /actions/{recommendation_id}/approve
POST /actions/{recommendation_id}/reject
"""

from typing import Optional
from fastapi import APIRouter, Body
from pydantic import BaseModel

from backend.api.schemas import ActionApprovalResponse, ActionRejectionResponse
from backend.api.state import service

router = APIRouter(tags=["Actions"])


class RejectionRequest(BaseModel):
    reason: Optional[str] = "Facility manager rejected action"


@router.post(
    "/actions/{recommendation_id}/approve",
    response_model=ActionApprovalResponse,
    summary="Approve a safety-gated recommendation and dispatch simulated control action",
)
def approve_action(recommendation_id: str) -> ActionApprovalResponse:
    """
    Facility-Manager Approval:
    - Enforces hard safety-gate checks (cannot approve un-gated or failed actions).
    - Applies simulated HVAC setback and lighting dimming in the simulator.
    - Steps physical integration forward.
    - Captures BEFORE and AFTER telemetry.
    - Calculates predicted and actual load reduction and verifies impact.
    - Returns full closed-loop audit trail.
    """
    res = service.approve_action(recommendation_id)
    return ActionApprovalResponse(**res)


@router.post(
    "/actions/{recommendation_id}/reject",
    response_model=ActionRejectionResponse,
    summary="Reject a recommendation without modifying building state",
)
def reject_action(
    recommendation_id: str,
    payload: Optional[RejectionRequest] = Body(default=None),
) -> ActionRejectionResponse:
    """
    Facility-Manager Rejection:
    - Records the rejection with timestamp and optional rationale.
    - Leaves building thermostat and equipment state completely untouched.
    - Returns clear confirmation status.
    """
    reason = payload.reason if payload and payload.reason else "Facility manager rejected action"
    res = service.reject_action(recommendation_id, reason=reason)
    return ActionRejectionResponse(**res)
