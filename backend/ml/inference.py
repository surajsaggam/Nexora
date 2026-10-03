"""
NEXORA ML Intelligence Layer - Unified Inference Service
Consumes live/simulated telemetry and provides structured predictions for the Decision Engine and FastAPI.
Pipeline: Telemetry Stream → ML Occupancy Forecast → Energy Baseline → Explainable Anomaly.
"""

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from backend.ml.anomaly import AnomalyDetector
from backend.ml.energy_baseline import EnergyBaselineModel
from backend.ml.occupancy_model import OccupancyForecaster
from backend.simulator.config import ZONES


class MLIntelligenceService:
    """
    Unified ML service packaging all 3 models for downstream Decision Engine consumption.
    """

    def __init__(self, models_dir: str = "backend/ml/models"):
        self.models_dir = Path(models_dir)
        self.occ_model = OccupancyForecaster.load(str(self.models_dir / "occupancy_forecaster.joblib"))
        self.nrg_model = EnergyBaselineModel.load(str(self.models_dir / "energy_baseline.joblib"))
        self.anomaly_detector = AnomalyDetector()

    def analyze_zone(
        self,
        zone_id: str,
        actual_power_kw: float,
        current_occupancy: int,
        timestamp: Optional[datetime] = None,
        outdoor_temp_c: float = 32.0,
        outdoor_humidity_pct: float = 50.0,
        solar_irradiance_w_per_m2: float = 650.0,
        current_temp_c: float = 22.0,
        target_setpoint_c: float = 22.0,
        lighting_pct: float = 80.0,
        occ_lag_15m: Optional[int] = None,
        occ_lag_30m: Optional[int] = None,
        occ_lag_60m: Optional[int] = None,
        occ_roll_mean_1h: Optional[float] = None,
        occ_roll_std_1h: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Analyzes a single zone's telemetry stream.
        Returns unified prediction and anomaly assessment for the Decision Engine.
        """
        if zone_id not in ZONES:
            raise ValueError(f"Unknown zone_id: {zone_id}. Expected one of {list(ZONES.keys())}")

        cfg = ZONES[zone_id]
        dt = timestamp or datetime.now()
        hour = dt.hour
        minute = dt.minute
        day_of_week = dt.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0

        # Default lags if not explicitly provided
        lag15 = current_occupancy if occ_lag_15m is None else occ_lag_15m
        lag30 = current_occupancy if occ_lag_30m is None else occ_lag_30m
        lag60 = current_occupancy if occ_lag_60m is None else occ_lag_60m
        roll_mean = float(current_occupancy) if occ_roll_mean_1h is None else occ_roll_mean_1h
        roll_std = 0.0 if occ_roll_std_1h is None else occ_roll_std_1h

        # 1. Occupancy Forecast (+60 min)
        occ_res = self.occ_model.predict_single(
            zone_id=zone_id,
            current_occ=current_occupancy,
            occ_lag_15m=lag15,
            occ_lag_30m=lag30,
            occ_lag_60m=lag60,
            occ_roll_mean_1h=roll_mean,
            occ_roll_std_1h=roll_std,
            hour=hour,
            minute=minute,
            day_of_week=day_of_week,
            is_weekend=is_weekend,
            max_capacity=cfg.max_capacity,
            area_sqm=cfg.area_sqm,
        )

        # 2. Energy Baseline Prediction
        nrg_res = self.nrg_model.predict_single(
            zone_id=zone_id,
            actual_power_kw=actual_power_kw,
            occupancy=current_occupancy,
            outdoor_temp_c=outdoor_temp_c,
            outdoor_humidity_pct=outdoor_humidity_pct,
            solar_irradiance_w_per_m2=solar_irradiance_w_per_m2,
            hour=hour,
            minute=minute,
            day_of_week=day_of_week,
            is_weekend=is_weekend,
            area_sqm=cfg.area_sqm,
            max_capacity=cfg.max_capacity,
        )

        # 3. Anomaly Detection
        anom_res = self.anomaly_detector.detect(
            zone_id=zone_id,
            actual_power_kw=actual_power_kw,
            expected_power_kw=nrg_res.expected_power_kw,
            occupancy=current_occupancy,
            lighting_pct=lighting_pct,
            target_setpoint=target_setpoint_c,
            current_temp=current_temp_c,
        )

        # 4. Synthesize Decision Engine Context
        eligible_for_setback = False
        recommended_action = "MAINTAIN"
        potential_kw_savings = 0.0

        if anom_res.is_anomaly and anom_res.category == "UNOCCUPIED_COOLING":
            eligible_for_setback = True
            recommended_action = "SETBACK_OPPORTUNITY"
            # Potential savings: difference between overcooling and setback load
            potential_kw_savings = round(max(0.0, actual_power_kw - nrg_res.expected_power_kw * 0.75), 2)
        elif current_occupancy == 0 and occ_res.predicted_occupancy_next_hour == 0:
            recommended_action = "DRIFT_SETBACK"
            eligible_for_setback = True
            potential_kw_savings = round(max(0.0, actual_power_kw * 0.4), 2)
        elif occ_res.trend == "RISING" and occ_res.predicted_occupancy_next_hour >= 10:
            recommended_action = "PRE_COOL"

        return {
            "timestamp": dt.isoformat(),
            "zone_id": zone_id,
            "zone_code": cfg.code,
            "zone_name": cfg.name,
            "occupancy_forecast": {
                "current_occupancy": occ_res.current_occupancy,
                "predicted_next_hour": occ_res.predicted_occupancy_next_hour,
                "confidence_score": occ_res.confidence_score,
                "trend": occ_res.trend,
                "evidence": occ_res.evidence,
            },
            "energy_baseline": {
                "actual_power_kw": nrg_res.actual_power_kw,
                "expected_power_kw": nrg_res.expected_power_kw,
                "variance_delta_kw": nrg_res.variance_delta_kw,
                "variance_pct": nrg_res.variance_pct,
                "evidence": nrg_res.evidence,
            },
            "anomaly": {
                "is_anomaly": anom_res.is_anomaly,
                "severity": anom_res.severity,
                "category": anom_res.category,
                "z_score": anom_res.z_score,
                "explainable_reason": anom_res.explainable_reason,
                "evidence": anom_res.evidence,
            },
            "decision_engine_context": {
                "recommended_action": recommended_action,
                "eligible_for_setback": eligible_for_setback,
                "potential_kw_savings": potential_kw_savings,
            },
        }


def run_demo_suite_b():
    """
    Demonstrates inference on the primary NEXORA hackathon use case:
    Conference Suite B (Z04) early departure at 14:15.
    """
    print("=" * 72)
    print(" NEXORA ML INTELLIGENCE - LIVE INFERENCE DEMO")
    print(" Scenario: Zone 04 (Conference Suite B) Early Departure")
    print("=" * 72)

    service = MLIntelligenceService()

    # Telemetry simulating early departure at 14:15 IST
    # Meeting ended early; room is empty, but cooling is blasting at 21.0°C and lighting is 100%
    sample_telemetry = {
        "zone_id": "z04",
        "current_occupancy": 0,  # 0 occupants!
        "actual_power_kw": 5.60, # Full chiller load + lights
        "timestamp": datetime(2026, 10, 5, 14, 15),
        "outdoor_temp_c": 33.2,
        "outdoor_humidity_pct": 46.0,
        "solar_irradiance_w_per_m2": 720.0,
        "current_temp_c": 21.2,
        "target_setpoint_c": 21.0,
        "lighting_pct": 100.0,
        "occ_lag_15m": 6,       # Was occupied 15 min ago
        "occ_lag_30m": 8,       # Was occupied 30 min ago
        "occ_lag_60m": 0,
        "occ_roll_mean_1h": 3.5,
        "occ_roll_std_1h": 3.8,
    }

    result = service.analyze_zone(**sample_telemetry)

    print(f"Zone:              {result['zone_name']} ({result['zone_code']})")
    print(f"Timestamp:         {result['timestamp']}")
    print("-" * 72)
    print("1. OCCUPANCY FORECAST (+60m):")
    occ = result["occupancy_forecast"]
    print(f"   Current Headcount:       {occ['current_occupancy']} persons")
    print(f"   Predicted (+60m):        {occ['predicted_next_hour']} persons")
    print(f"   Trend:                   {occ['trend']}")
    print(f"   Model Confidence:        {occ['confidence_score']}%")
    print(f"   Evidence Tag:            {occ['evidence']}")
    print("-" * 72)
    print("2. ENERGY BASELINE (ASHRAE Guideline 14):")
    nrg = result["energy_baseline"]
    print(f"   Actual Power:            {nrg['actual_power_kw']:.2f} kW")
    print(f"   Expected Learned Power:  {nrg['expected_power_kw']:.2f} kW")
    print(f"   Variance Delta:          +{nrg['variance_delta_kw']:.2f} kW ({nrg['variance_pct']:+.1f}%)")
    print(f"   Evidence Tag:            {nrg['evidence']}")
    print("-" * 72)
    print("3. EXPLAINABLE ANOMALY DETECTOR:")
    anom = result["anomaly"]
    print(f"   Anomaly Flag:            {anom['is_anomaly']}")
    print(f"   Severity:                {anom['severity']}")
    print(f"   Category:                {anom['category']}")
    print(f"   Z-Score:                 {anom['z_score']:+.2f} sigma")
    print(f"   Explanation:             {anom['explainable_reason']}")
    print(f"   Evidence Tag:            {anom['evidence']}")
    print("-" * 72)
    print("4. DECISION ENGINE HANDOFF CONTEXT:")
    dec = result["decision_engine_context"]
    print(f"   Recommended Action:      {dec['recommended_action']}")
    print(f"   Eligible for Setback:    {dec['eligible_for_setback']}")
    print(f"   Potential Load Shed:     -{dec['potential_kw_savings']:.2f} kW")
    print("=" * 72)

    return result


if __name__ == "__main__":
    run_demo_suite_b()
