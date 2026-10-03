"""
NEXORA Building Intelligence Platform - API Schemas (Pydantic v2)
Strict schema definitions adhering to NEXORA Evidence Discipline:
- Simulator telemetry = SIMULATED
- ML predictions = MODELLED
- Recommendations & Actions = SIMULATED
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ComfortBandSchema(BaseModel):
    min_temp: float = Field(..., description="Minimum comfortable temperature in °C")
    max_temp: float = Field(..., description="Maximum comfortable temperature in °C")
    max_co2: float = Field(..., description="Maximum acceptable CO2 ppm")
    min_humidity: float = Field(40.0, description="Minimum humidity %")
    max_humidity: float = Field(65.0, description="Maximum humidity %")


class ZoneSummaryResponse(BaseModel):
    """
    Summary view of a single zone conforming to frontend contract:
    {
      "zone_id": "Z04-CSB",
      "name": "Conference Suite B",
      "occupancy": 0,
      "temperature_c": 21.2,
      "co2_ppm": 440,
      "power_kw": 5.6,
      "evidence": "SIMULATED"
    }
    """
    zone_id: str = Field(..., description="Public zone identifier / code (e.g. Z04-CSB)")
    name: str = Field(..., description="Human-readable zone name")
    occupancy: int = Field(..., description="Current occupant count")
    temperature_c: float = Field(..., description="Current indoor air temperature in °C")
    co2_ppm: float = Field(..., description="Indoor CO2 concentration in ppm")
    power_kw: float = Field(..., description="Total active zone electrical power in kW")
    evidence: str = Field("SIMULATED", description="Data provenance flag")

    # Additional contextual attributes for frontend clients
    id: Optional[str] = Field(None, description="Internal zone key (e.g. z04)")
    code: Optional[str] = Field(None, description="Zone code (e.g. Z04-CSB)")
    floor: Optional[int] = Field(4, description="Floor level")
    target_setpoint_c: Optional[float] = Field(None, description="Active HVAC thermostat setpoint °C")
    humidity_pct: Optional[float] = Field(None, description="Relative humidity %")
    hvac_mode: Optional[str] = Field(None, description="Operating HVAC mode")
    fan_speed: Optional[str] = Field(None, description="AHU fan speed")
    lighting_pct: Optional[float] = Field(None, description="Lighting level %")
    has_anomaly: Optional[bool] = Field(None, description="Whether zone has an active anomaly")
    anomaly_description: Optional[str] = Field(None, description="Description of anomaly if active")

    model_config = ConfigDict(extra="ignore")


class ZoneDetailResponse(BaseModel):
    """Detailed telemetry and equipment state for an individual zone."""
    zone_id: str
    id: str
    name: str
    code: str
    floor: int
    area_sqm: float
    max_capacity: int
    occupancy: int
    predicted_occupancy_next_hour: int
    occupancy_trend: str
    temperature_c: float
    target_setpoint_c: float
    co2_ppm: float
    humidity_pct: float
    comfort_band: ComfortBandSchema
    power_kw: float
    hvac_electrical_kw: float
    lighting_electrical_kw: float
    equipment_electrical_kw: float
    cooling_thermal_kw: float
    baseline_expected_kw: float
    variance_delta_kw: float
    hvac_mode: str
    fan_speed: str
    lighting_level_pct: float
    has_anomaly: bool
    anomaly_description: str
    evidence: str = "SIMULATED"

    model_config = ConfigDict(extra="ignore")


class SafetyChecksCount(BaseModel):
    passed: int
    total: int


class SafetyCheckDetailSchema(BaseModel):
    category: str
    name: str
    passed: bool
    value: str
    threshold: str
    detail: str


class RecommendationResponse(BaseModel):
    """
    Structured recommendation conforming to frontend contract:
    {
      "recommendation_id": "rec-z04-141500",
      "zone_id": "Z04-CSB",
      "status": "PENDING_APPROVAL",
      "action": "HVAC_SETBACK_LIGHTING_DIM",
      "predicted_load_reduction_kw": 1.91,
      "safety_checks": {
        "passed": 5,
        "total": 5
      },
      "confidence": 98.5,
      "evidence": "SIMULATED"
    }
    """
    recommendation_id: str
    zone_id: str
    status: str
    action: str
    predicted_load_reduction_kw: float
    safety_checks: SafetyChecksCount
    confidence: float
    evidence: str = "SIMULATED"

    # Contextual and explanation fields
    zone_name: Optional[str] = None
    action_name: Optional[str] = None
    why: Optional[str] = None
    trigger_signal: Optional[str] = None
    target_setpoint_c: Optional[float] = None
    lighting_level_pct: Optional[float] = None
    avoided_energy_kwh: Optional[float] = None
    predicted_cost_savings_inr: Optional[float] = None
    predicted_temperature_c: Optional[float] = None
    temp_drift_c: Optional[float] = None
    safety_gate_passed: Optional[bool] = None
    safety_checks_detail: Optional[List[SafetyCheckDetailSchema]] = None
    created_at: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class TelemetrySnapshot(BaseModel):
    zone_id: str
    temperature_c: float
    target_setpoint_c: float
    co2_ppm: float
    humidity_pct: float
    lighting_pct: float
    total_power_kw: float
    hvac_power_kw: Optional[float] = None
    lighting_power_kw: Optional[float] = None
    occupancy: int
    evidence: str = "SIMULATED"


class PredictedImpactSchema(BaseModel):
    predicted_load_reduction_kw: float
    avoided_energy_kwh: float
    predicted_cost_savings_inr: float
    predicted_temperature_c: float
    temp_drift_c: float
    predicted_co2_ppm: float
    comfort_impact_summary: str
    evidence: str = "SIMULATED"


class ActualImpactSchema(BaseModel):
    actual_load_reduction_kw: float
    avoided_energy_kwh: float
    actual_cost_savings_inr: float
    evidence: str = "SIMULATED"


class VerificationStatusSchema(BaseModel):
    status: str = "VERIFIED"
    comfort_preserved: bool
    iaq_preserved: bool
    delta_kw: float
    variance_pct: float
    evidence: str = "SIMULATED"


class ActionApprovalResponse(BaseModel):
    """
    Full closed-loop verification response returned upon recommendation approval:
    BEFORE -> ACTION -> AFTER -> VERIFIED IMPACT
    """
    recommendation_id: str
    zone_id: str
    status: str = "APPROVED"
    action: str
    executed_at: str
    before_telemetry: TelemetrySnapshot
    after_telemetry: TelemetrySnapshot
    predicted_impact: PredictedImpactSchema
    actual_impact: ActualImpactSchema
    verification: VerificationStatusSchema
    evidence: str = "SIMULATED"


class ActionRejectionResponse(BaseModel):
    recommendation_id: str
    zone_id: str
    status: str = "REJECTED"
    reason: str
    building_state_modified: bool = False
    timestamp: str
    evidence: str = "SIMULATED"


class VerificationRecordSchema(BaseModel):
    id: str
    recommendation_id: str
    zone_id: str
    zone_name: str
    action: str
    executed_at: str
    verified_at: str
    before_power_kw: float
    after_power_kw: float
    measured_reduction_kw: float
    predicted_reduction_kw: float
    avoided_energy_kwh: float
    cost_saved_inr: float
    comfort_preserved: bool
    iaq_preserved: bool
    status: str
    evidence: str = "SIMULATED"


class ImpactSummaryResponse(BaseModel):
    """Cumulative M&V proof-of-impact summary for the building."""
    total_verified_load_reduction_kw: float
    total_avoided_energy_kwh: float
    total_cost_savings_inr: float
    interventions_count: int
    comfort_compliance_pct: float
    iaq_compliance_pct: float
    active_anomalies_count: int
    gross_building_power_kw: float
    baseline_building_power_kw: float
    variance_delta_kw: float
    verification_records: List[VerificationRecordSchema]
    evidence: str = "SIMULATED"


class SimulationEventRequest(BaseModel):
    scenario_id: Optional[str] = "suite_b_early_vacancy"
    zone_id: Optional[str] = "z04"
    timestamp_iso: Optional[str] = None


class SimulationEventResponse(BaseModel):
    event: str
    scenario: str
    timestamp: str
    target_zone: str
    description: str
    recommendation_id: Optional[str]
    current_power_kw: float
    evidence: str = "SIMULATED"


class PeakEventRequest(BaseModel):
    duration_minutes: Optional[int] = 120
    target_limit_kw: Optional[float] = 60.0
    scenario_id: Optional[str] = "summer_peak"
    zone_id: Optional[str] = None
    timestamp_iso: Optional[str] = None


class PeakEventResponse(BaseModel):
    """
    Standardized NEXORA Peak Demand Response Event Record:
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
    event_id: str
    status: str
    target_limit_kw: float
    baseline_peak_kw: float
    current_peak_kw: float
    peak_reduction_kw: float
    participating_zones: List[str]
    protected_zones: List[str]
    actions_executed: List[Dict[str, Any]]
    comfort_pass: bool
    iaq_pass: bool
    evidence: str = "SIMULATED"

    # Contextual metadata
    duration_minutes: Optional[int] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    scenario_id: Optional[str] = None
    high_demand_detected: Optional[bool] = None
    utilization_pct: Optional[float] = None

    model_config = ConfigDict(extra="ignore")


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    components: Dict[str, str]
    active_scenario: str
    evidence: str = "SIMULATED"
