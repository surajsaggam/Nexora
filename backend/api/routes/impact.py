"""
NEXORA Building Intelligence Platform - M&V Proof of Impact Endpoints
GET /impact
"""

from fastapi import APIRouter

from backend.api.schemas import ImpactSummaryResponse
from backend.api.state import service

router = APIRouter(tags=["Impact & Verification"])


@router.get(
    "/impact",
    response_model=ImpactSummaryResponse,
    summary="Get Measurement & Verification (M&V) summary of achieved savings",
)
def get_impact() -> ImpactSummaryResponse:
    """
    Returns verified building impact metrics adhering to ASHRAE Guideline 14:
    - Cumulative verified load reduction (kW)
    - Total avoided electrical energy (kWh)
    - Total cost savings in INR
    - Count of verified interventions
    - Whole-building comfort compliance rate (%)
    - Whole-building IAQ compliance rate (%)
    - List of historical verification records
    - Evidence provenance tag ("SIMULATED")
    """
    res = service.get_impact()
    return ImpactSummaryResponse(**res)
