"""
NEXORA Building Intelligence Platform - Zone Telemetry Endpoints
GET /zones
GET /zones/{zone_id}/state
"""

from typing import List
from fastapi import APIRouter, HTTPException, status

from backend.api.schemas import ZoneDetailResponse, ZoneSummaryResponse
from backend.api.state import service
from backend.simulator.config import ZONES

router = APIRouter(tags=["Zones"])


@router.get(
    "/zones",
    response_model=List[ZoneSummaryResponse],
    summary="List all 8 building zones with live/simulated telemetry",
)
def get_all_zones() -> List[ZoneSummaryResponse]:
    """
    Returns real-time telemetry snapshot for all 8 zones of the Apex Horizon Complex:
    - Zone ID / Code (e.g. Z04-CSB)
    - Name
    - Occupancy count
    - Temperature (°C)
    - CO2 level (ppm)
    - Power (kW)
    - Provenance flag ("SIMULATED")
    """
    zones_data = service.get_zones()
    return [ZoneSummaryResponse(**z) for z in zones_data]


@router.get(
    "/zones/{zone_id}/state",
    response_model=ZoneDetailResponse,
    summary="Get detailed environmental and equipment state for a single zone",
)
def get_zone_state(zone_id: str) -> ZoneDetailResponse:
    """
    Returns exhaustive telemetry, thermal bounds, baseline power, and anomaly states for a zone.
    Accepts both zone code (e.g. 'Z04-CSB') and internal key (e.g. 'z04').
    """
    detail = service.get_zone_detail(zone_id)
    if not detail:
        valid_zones = [f"{cfg.code} ({zid})" for zid, cfg in ZONES.items()]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Zone '{zone_id}' not found. Valid zones: {valid_zones}",
        )
    return ZoneDetailResponse(**detail)
