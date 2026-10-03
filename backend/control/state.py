"""
NEXORA Control Layer - State & Action Definitions
Defines supported BMS control actions, execution results, and zone control state tracking.
Strictly adheres to NEXORA Evidence Discipline (evidence="SIMULATED").
"""

from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional, Set

EvidenceType = Literal["SIMULATED", "MEASURED", "ASSUMED"]
ControlStatus = Literal["EXECUTED", "REJECTED", "FAILED", "PENDING"]

SUPPORTED_ACTIONS: Set[str] = {
    "NO_ACTION",
    "HVAC_SETBACK",
    "HVAC_SETBACK_LIGHTING_DIM",
}


@dataclass
class ControlExecutionResult:
    """
    Standardized control execution acknowledgement matching NEXORA specification:
    {
      "status": "EXECUTED",
      "zone_id": "Z04-CSB",
      "action": "HVAC_SETBACK_LIGHTING_DIM",
      "setpoint_c": 24.5,
      "lighting_pct": 15,
      "evidence": "SIMULATED"
    }
    """
    status: ControlStatus
    zone_id: str
    action: str
    setpoint_c: float
    lighting_pct: float
    evidence: str = "SIMULATED"
    hvac_mode: str = "COOLING"
    fan_speed: str = "AUTO"
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    authorized: bool = True
    detail: str = "Simulated control action applied to building BMS."

    def to_dict(self) -> Dict[str, Any]:
        """Serializes result for API and frontend consumption."""
        return asdict(self)


@dataclass
class ZoneControlState:
    """Tracks active control actuation and thermostat setpoints for a zone."""
    zone_id: str
    active_setpoint_c: float
    active_lighting_pct: float
    active_hvac_mode: str
    active_fan_speed: str
    manual_override: bool = False
    last_actuation_time: Optional[datetime] = None
    last_action_id: Optional[str] = None
    last_recommendation_id: Optional[str] = None


class BMSControlStateTracker:
    """
    Simulated BMS Gateway tracking active zone control overrides,
    anti-short-cycle lockout intervals, and actuation authorization.
    """

    def __init__(self, min_lockout_minutes: float = 15.0):
        self.min_lockout_minutes = min_lockout_minutes
        self.zone_states: Dict[str, ZoneControlState] = {}
        self.execution_history: List[ControlExecutionResult] = []

    def register_zone(
        self,
        zone_id: str,
        setpoint_c: float,
        lighting_pct: float,
        hvac_mode: str = "COOLING",
        fan_speed: str = "AUTO",
    ):
        """Initializes tracking for a zone."""
        self.zone_states[zone_id] = ZoneControlState(
            zone_id=zone_id,
            active_setpoint_c=setpoint_c,
            active_lighting_pct=lighting_pct,
            active_hvac_mode=hvac_mode,
            active_fan_speed=fan_speed,
            manual_override=False,
            last_actuation_time=None,
        )

    def can_actuate(self, zone_id: str, current_time: datetime) -> bool:
        """Verifies equipment anti-short-cycle lockout (>= 15 min since last actuation)."""
        st = self.zone_states.get(zone_id)
        if not st or not st.last_actuation_time:
            return True
        elapsed = (current_time - st.last_actuation_time).total_seconds() / 60.0
        return elapsed >= self.min_lockout_minutes

    def record_actuation(
        self,
        zone_id: str,
        result: ControlExecutionResult,
        current_time: datetime,
    ):
        """Updates internal state and audit trail after actuation."""
        if zone_id in self.zone_states:
            st = self.zone_states[zone_id]
            st.active_setpoint_c = result.setpoint_c
            st.active_lighting_pct = result.lighting_pct
            st.active_hvac_mode = result.hvac_mode
            st.active_fan_speed = result.fan_speed
            st.manual_override = True
            st.last_actuation_time = current_time
            st.last_action_id = result.action

        self.execution_history.append(result)

    def reset(self):
        """Resets tracker state."""
        self.zone_states.clear()
        self.execution_history.clear()
