"""
NEXORA Decision Engine - Safety & Constraint Gate
Enforces the 5 hard engineering guardrails before any action can be approved or dispatched:
1. Thermal Comfort Limit (ASHRAE 55)
2. Indoor Air Quality / CO2 Limit (ASHRAE 62.1)
3. Equipment Anti-Short-Cycle Lockout (>= 15m)
4. Building & Zone Criticality Policy (e.g. Server Room lock)
5. Model Prediction Confidence Threshold (>= 85.0%)
"""

from dataclasses import dataclass
from typing import List, Optional
from backend.decision_engine.candidates import CandidateAction
from backend.decision_engine.what_if import WhatIfResult
from backend.simulator.config import ZONES, ZoneConfig


@dataclass
class SafetyCheck:
    category: str  # "COMFORT" | "IAQ" | "EQUIPMENT" | "OPERATING_RULE" | "MODEL_CONFIDENCE"
    name: str
    passed: bool
    value: str
    threshold: str
    detail: str


@dataclass
class SafetyGateResult:
    action_id: str
    all_passed: bool
    passed_count: int
    total_count: int
    checks: List[SafetyCheck]
    rejection_reason: Optional[str] = None
    evidence: str = "SIMULATED"


class SafetyGate:
    """
    Evaluates candidate action and What-If projections against hard building constraints.
    Guarantees that energy reduction never compromises safety, equipment health, or critical zones.
    """

    def __init__(
        self,
        min_compressor_lockout_min: float = 15.0,
        min_confidence_pct: float = 85.0,
    ):
        self.min_compressor_lockout_min = min_compressor_lockout_min
        self.min_confidence_pct = min_confidence_pct

    def evaluate(
        self,
        zone_id: str,
        action: CandidateAction,
        what_if: WhatIfResult,
        model_confidence_pct: float = 95.0,
        elapsed_since_last_actuation_min: float = 54.0,
        is_executive_lock: bool = False,
    ) -> SafetyGateResult:
        """
        Runs all 5 safety checks and returns detailed PASS/FAIL breakdown.
        """
        cfg = ZONES.get(zone_id)
        if not cfg:
            raise ValueError(f"Unknown zone_id: {zone_id}")

        checks: List[SafetyCheck] = []
        rejection_reasons: List[str] = []

        # -------------------------------------------------------------
        # 1. Thermal Comfort Check (ASHRAE 55)
        # -------------------------------------------------------------
        t_pred = what_if.predicted_temperature_c
        t_min = cfg.comfort_band.min_temp
        t_max = cfg.comfort_band.max_temp
        comfort_passed = (t_min <= t_pred <= t_max)
        if comfort_passed:
            comfort_detail = f"Predicted temperature {t_pred:.1f}C is within comfortable [{t_min:.1f}C - {t_max:.1f}C] boundary."
        else:
            comfort_detail = f"Predicted temperature {t_pred:.1f}C violates [{t_min:.1f}C - {t_max:.1f}C] comfort limit."
            rejection_reasons.append(comfort_detail)

        checks.append(
            SafetyCheck(
                category="COMFORT",
                name="Thermal Comfort Boundary",
                passed=comfort_passed,
                value=f"{t_pred:.1f}C target",
                threshold=f"{t_min:.1f}C - {t_max:.1f}C",
                detail=comfort_detail,
            )
        )

        # -------------------------------------------------------------
        # 2. Indoor Air Quality (CO2) Check (ASHRAE 62.1)
        # -------------------------------------------------------------
        co2_pred = what_if.predicted_co2_ppm
        co2_max = cfg.comfort_band.max_co2
        iaq_passed = (co2_pred <= co2_max)
        if iaq_passed:
            iaq_detail = f"Predicted CO2 concentration {co2_pred:.0f} ppm is well below {co2_max:.0f} ppm limit."
        else:
            iaq_detail = f"Predicted CO2 {co2_pred:.0f} ppm exceeds {co2_max:.0f} ppm IAQ boundary."
            rejection_reasons.append(iaq_detail)

        checks.append(
            SafetyCheck(
                category="IAQ",
                name="Indoor Air Quality (CO2)",
                passed=iaq_passed,
                value=f"{co2_pred:.0f} ppm",
                threshold=f"<= {co2_max:.0f} ppm",
                detail=iaq_detail,
            )
        )

        # -------------------------------------------------------------
        # 3. Equipment Anti-Short-Cycle Lockout Check
        # -------------------------------------------------------------
        # NO_ACTION never violates compressor cycle; control adjustments require >= 15m elapsed
        if action.id == "NO_ACTION":
            equip_passed = True
            equip_detail = "No equipment state change proposed."
        else:
            equip_passed = (elapsed_since_last_actuation_min >= self.min_compressor_lockout_min)
            if equip_passed:
                equip_detail = f"{elapsed_since_last_actuation_min:.0f}m elapsed since last actuation; exceeds {self.min_compressor_lockout_min:.0f}m compressor anti-cycle lockout."
            else:
                equip_detail = f"Only {elapsed_since_last_actuation_min:.0f}m elapsed; violates minimum {self.min_compressor_lockout_min:.0f}m anti-short-cycle lockout."
                rejection_reasons.append(equip_detail)

        checks.append(
            SafetyCheck(
                category="EQUIPMENT",
                name="Compressor Anti-Cycle Lockout",
                passed=equip_passed,
                value=f"{elapsed_since_last_actuation_min:.0f}m elapsed",
                threshold=f">= {self.min_compressor_lockout_min:.0f}m lockout",
                detail=equip_detail,
            )
        )

        # -------------------------------------------------------------
        # 4. Building / Zone Criticality Policy Check
        # -------------------------------------------------------------
        # Server room (z07) is Tier 1 mission critical: automated setbacks strictly blocked
        is_critical_zone = (zone_id == "z07")
        if action.id == "NO_ACTION":
            rule_passed = True
            rule_detail = "Status quo preserves current mission-critical state."
        elif is_critical_zone:
            rule_passed = False
            rule_detail = "Server Room & UPS Hub is classified as Mission-Critical Tier 1. Automated temperature setbacks are strictly prohibited."
            rejection_reasons.append(rule_detail)
        elif is_executive_lock:
            rule_passed = False
            rule_detail = "Executive VIP manual lock is active for this zone. AI automation blocked."
            rejection_reasons.append(rule_detail)
        else:
            rule_passed = True
            rule_detail = "Zone is marked as flexible commercial office space. No executive lock or override active."

        checks.append(
            SafetyCheck(
                category="OPERATING_RULE",
                name="Zone Criticality Policy",
                passed=rule_passed,
                value="Tier 1 Critical" if is_critical_zone else ("Executive Lock" if is_executive_lock else "Standard Tier"),
                threshold="Non-Critical Office",
                detail=rule_detail,
            )
        )

        # -------------------------------------------------------------
        # 5. Prediction Model Confidence Check
        # -------------------------------------------------------------
        if action.id == "NO_ACTION":
            conf_passed = True
            conf_detail = "Status quo does not rely on forward model projection."
        else:
            conf_passed = (model_confidence_pct >= self.min_confidence_pct)
            if conf_passed:
                conf_detail = f"Model prediction confidence ({model_confidence_pct:.1f}%) meets threshold (>={self.min_confidence_pct:.1f}%)."
            else:
                conf_detail = f"Model prediction confidence ({model_confidence_pct:.1f}%) is below required threshold ({self.min_confidence_pct:.1f}%)."
                rejection_reasons.append(conf_detail)

        checks.append(
            SafetyCheck(
                category="MODEL_CONFIDENCE",
                name="Prediction Model Confidence",
                passed=conf_passed,
                value=f"{model_confidence_pct:.1f}%",
                threshold=f">= {self.min_confidence_pct:.1f}%",
                detail=conf_detail,
            )
        )

        # Summary
        passed_count = sum(1 for c in checks if c.passed)
        total_count = len(checks)
        all_passed = (passed_count == total_count)

        return SafetyGateResult(
            action_id=action.id,
            all_passed=all_passed,
            passed_count=passed_count,
            total_count=total_count,
            checks=checks,
            rejection_reason="; ".join(rejection_reasons) if not all_passed else None,
            evidence="SIMULATED",
        )
