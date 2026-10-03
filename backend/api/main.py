"""
NEXORA Building Intelligence Platform - FastAPI Integration Layer
Main entrypoint for the unified API service.
Exposes:
- GET  /health
- GET  /zones
- GET  /zones/{zone_id}/state
- GET  /recommendations
- POST /actions/{recommendation_id}/approve
- POST /actions/{recommendation_id}/reject
- GET  /impact
- POST /sim/peak-event
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes.actions import router as actions_router
from backend.api.routes.impact import router as impact_router
from backend.api.routes.recommendations import router as recommendations_router
from backend.api.routes.simulation import router as simulation_router
from backend.api.routes.zones import router as zones_router
from backend.api.schemas import HealthResponse
from backend.api.state import service

app = FastAPI(
    title="NEXORA Building Intelligence API",
    description=(
        "Production-grade integration layer connecting Simulator, ML Intelligence, "
        "and Decision Engine for smart building optimization. Adheres to NEXORA Evidence Discipline."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware enabling Next.js frontend consumption
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Service health and subsystem readiness check",
)
def get_health() -> HealthResponse:
    """Returns current health status, active simulation time, and subsystem online flags."""
    return HealthResponse(**service.get_health())


@app.get(
    "/",
    tags=["System"],
    summary="API Root and Service Information",
)
def root():
    return {
        "service": "NEXORA Building Intelligence API",
        "version": "1.0.0",
        "status": "ONLINE",
        "documentation": "/docs",
        "endpoints": {
            "health": "/health",
            "zones": "/zones",
            "recommendations": "/recommendations",
            "impact": "/impact",
            "peak_event": "/sim/peak-event",
        },
        "evidence": "SIMULATED",
    }


# Include sub-routers
app.include_router(zones_router)
app.include_router(recommendations_router)
app.include_router(actions_router)
app.include_router(impact_router)
app.include_router(simulation_router)
