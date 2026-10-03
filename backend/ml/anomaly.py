"""
NEXORA ML Intelligence Layer - Explainable Anomaly Detector
Detects meaningful operational deviations: Residual = Actual Power - Expected Power.
Flags zones with anomalous overconsumption and generates human-interpretable explanations.
"""

from dataclasses import dataclass
from typing import Dict, List, Literal, Optional
import numpy as np

SeverityLevel = Literal["NORMAL", "LOW", "MEDIUM", "HIGH", "CRITICAL"]


@dataclass
class AnomalyDetectionResult:
    zone_id: str
    is_anomaly: bool
    residual_kw: float       # Actual - Expected Power
    residual_pct: float      # Residual / Expected * 100
    z_score: float           # Normalized standard deviations from baseline
    severity: SeverityLevel
    category: str            # "UNOCCUPIED_COOLING" | "OVERCONSUMPTION" | "NORMAL"
    explainable_reason: str
    evidence: str = "MODELLED"


class AnomalyDetector:
    """
    Residual-based anomaly detector combining statistical bounds with operational logic.
    Identifies:
    1. Unoccupied overcooling / lighting waste (e.g. Conference Suite B early departure)
    2. Significant positive deviations beyond learned baseline tolerance
    """

    def __init__(
        self,
        z_threshold: float = 2.5,
        min_residual_kw: float = 1.0,
    ):
        self.z_threshold = z_threshold
        self.min_residual_kw = min_residual_kw
        # Zone-specific residual standard deviations calibrated on holdout baseline
        self.zone_residual_stds: Dict[str, float] = {
            "z01": 0.55,
            "z02": 0.60,
            "z03": 0.35,
            "z04": 0.30,
            "z05": 0.40,
            "z06": 0.45,
            "z07": 0.25,
            "z08": 0.20,
        }

    def calibrate(self, zone_residuals: Dict[str, np.ndarray]):
        """Calibrates residual standard deviations per zone from holdout baseline data."""
        for zid, res in zone_residuals.items():
            if len(res) > 10:
                std = float(np.std(res))
                self.zone_residual_stds[zid] = max(0.15, std)

    def detect(
        self,
        zone_id: str,
        actual_power_kw: float,
        expected_power_kw: float,
        occupancy: int,
        hvac_mode: str = "COOLING",
        lighting_pct: float = 80.0,
        target_setpoint: float = 22.0,
        current_temp: float = 22.0,
    ) -> AnomalyDetectionResult:
        """
        Evaluates real-time telemetry against expected baseline.
        Returns actionable flag and human-readable explanation.
        """
        residual_kw = round(actual_power_kw - expected_power_kw, 2)
        residual_pct = round((residual_kw / max(0.5, expected_power_kw)) * 100.0, 1)

        std = self.zone_residual_stds.get(zone_id, 0.40)
        z_score = round(residual_kw / std, 2)

        is_anomaly = False
        severity: SeverityLevel = "NORMAL"
        category = "NORMAL"
        reason = "Zone power consumption aligns with expected baseline."

        # Scenario 1: Unoccupied Cooling Waste (Classic Suite B early departure)
        # Occupancy is 0, but actual power is significantly higher than expected baseline
        if occupancy == 0 and (residual_kw >= 0.50 or residual_pct >= 30.0) and actual_power_kw >= 1.8:
            is_anomaly = True
            category = "UNOCCUPIED_COOLING"
            if residual_kw >= 1.5 or z_score >= 8.0:
                severity = "CRITICAL"
            elif residual_kw >= 0.8 or z_score >= 4.0:
                severity = "HIGH"
            else:
                severity = "MEDIUM"

            reason = (
                f"Zone is vacant (0 occupants), yet consuming {actual_power_kw:.2f} kW "
                f"(+{residual_kw:.2f} kW / +{residual_pct:.0f}% above expected {expected_power_kw:.2f} kW baseline). "
                f"HVAC actively chilling at {target_setpoint:.1f}C with lighting at {lighting_pct:.0f}%."
            )

        # Scenario 2: Statistical Overconsumption during Occupancy
        elif residual_kw > self.min_residual_kw and z_score >= self.z_threshold:
            is_anomaly = True
            category = "OVERCONSUMPTION"
            if z_score >= 4.0:
                severity = "HIGH"
            else:
                severity = "MEDIUM"

            reason = (
                f"Active power {actual_power_kw:.2f} kW is +{residual_kw:.2f} kW above expected baseline "
                f"(Z-score: {z_score:.1f} sigma). Potential equipment strain or damper leakage."
            )

        # Scenario 3: Mild deviation
        elif residual_kw > self.min_residual_kw and z_score >= 1.8:
            severity = "LOW"
            reason = f"Mild elevation (+{residual_kw:.2f} kW above expected), within operational tolerance."

        return AnomalyDetectionResult(
            zone_id=zone_id,
            is_anomaly=is_anomaly,
            residual_kw=residual_kw,
            residual_pct=residual_pct,
            z_score=z_score,
            severity=severity,
            category=category,
            explainable_reason=reason,
            evidence="MODELLED",
        )
