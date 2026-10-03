"""
NEXORA ML Intelligence Layer - Automated Test Suite
Verifies:
1. Feature pipeline integrity & chronological train/test split (no data leakage)
2. Occupancy Forecaster physical bounds and accuracy
3. Energy Baseline compliance with ASHRAE Guideline 14 standards
4. Explainable Anomaly Detection on Conference Suite B (Z04) early departure
5. Evidence discipline: All ML outputs tagged strictly as MODELLED
6. Downstream Decision Engine & FastAPI contract readiness
"""

from datetime import datetime
from pathlib import Path
import pytest
import numpy as np
import pandas as pd

from backend.ml.anomaly import AnomalyDetector
from backend.ml.energy_baseline import EnergyBaselineModel
from backend.ml.features import (
    add_time_features,
    build_energy_baseline_dataset,
    build_occupancy_dataset,
    temporal_train_test_split,
)
from backend.ml.inference import MLIntelligenceService
from backend.ml.occupancy_model import OccupancyForecaster


@pytest.fixture(scope="module")
def sample_dataset():
    data_path = Path("backend/data/simulated/nexora_apex_floor4_standard_zones.parquet")
    assert data_path.exists(), f"Dataset missing: {data_path}"
    df = pd.read_parquet(data_path)
    return df


def test_chronological_train_test_split(sample_dataset):
    """Verifies that temporal split prevents data leakage (no future data in training set)."""
    train_df, test_df = temporal_train_test_split(sample_dataset, train_ratio=0.80)

    assert len(train_df) > 0
    assert len(test_df) > 0
    # Strict temporal boundary check: max(train) < min(test)
    assert train_df["timestamp"].max() < test_df["timestamp"].min()


def test_time_features_cyclical_bounds(sample_dataset):
    """Verifies cyclical sine/cosine time transforms stay strictly within [-1.0, 1.0]."""
    df_feat = add_time_features(sample_dataset.head(100))

    assert "hour_sin" in df_feat.columns
    assert "hour_cos" in df_feat.columns
    assert df_feat["hour_sin"].min() >= -1.0
    assert df_feat["hour_sin"].max() <= 1.0
    assert df_feat["hour_cos"].min() >= -1.0
    assert df_feat["hour_cos"].max() <= 1.0


def test_occupancy_model_artifacts_and_bounds():
    """Verifies trained occupancy model loads, predicts within bounds, and derives trends."""
    model_path = Path("backend/ml/models/occupancy_forecaster.joblib")
    assert model_path.exists(), "Occupancy forecaster model artifact not found."

    forecaster = OccupancyForecaster.load(str(model_path))

    # Test single prediction
    res = forecaster.predict_single(
        zone_id="z04",
        current_occ=0,
        occ_lag_15m=0,
        occ_lag_30m=0,
        occ_lag_60m=0,
        occ_roll_mean_1h=0.0,
        occ_roll_std_1h=0.0,
        hour=14,
        minute=15,
        day_of_week=0,
        is_weekend=0,
        max_capacity=12,
        area_sqm=75.0,
    )

    assert res.evidence == "MODELLED"
    assert 0 <= res.predicted_occupancy_next_hour <= 12
    assert 50.0 <= res.confidence_score <= 100.0
    assert res.trend in ("VACANT", "STABLE", "RISING", "FALLING")


def test_energy_baseline_ashrae_compliance(sample_dataset):
    """Verifies baseline model satisfies ASHRAE Guideline 14 standards."""
    model_path = Path("backend/ml/models/energy_baseline.joblib")
    assert model_path.exists(), "Energy baseline model artifact not found."

    model = EnergyBaselineModel.load(str(model_path))

    # Evaluate on holdout data
    _, test_df = temporal_train_test_split(sample_dataset, train_ratio=0.80)
    X_test, y_test = build_energy_baseline_dataset(test_df, filter_anomalies=False)

    metrics = model.evaluate(X_test, y_test)

    # ASHRAE Guideline 14 Standard: CV(RMSE) <= 30.0%, |NMBE| <= 10.0%
    assert metrics["cv_rmse_pct"] <= 30.0, f"CV(RMSE) breached: {metrics['cv_rmse_pct']}%"
    assert abs(metrics["nmbe_pct"]) <= 10.0, f"NMBE breached: {metrics['nmbe_pct']}%"
    assert metrics["ashrae_14_compliant"] is True
    assert metrics["r2_score"] >= 0.85


def test_anomaly_detection_suite_b():
    """Verifies Conference Suite B early departure is flagged with explainable reason."""
    detector = AnomalyDetector()

    # Scenario: Vacant room (0 occ), but 5.60 kW load vs 1.50 kW baseline
    res = detector.detect(
        zone_id="z04",
        actual_power_kw=5.60,
        expected_power_kw=1.50,
        occupancy=0,
        target_setpoint=21.0,
        lighting_pct=100.0,
    )

    assert res.is_anomaly is True
    assert res.category == "UNOCCUPIED_COOLING"
    assert res.severity in ("HIGH", "CRITICAL")
    assert res.residual_kw > 3.0
    assert res.evidence == "MODELLED"
    assert "vacant" in res.explainable_reason.lower()


def test_ml_intelligence_service_e2e():
    """Tests end-to-end inference service contract ready for FastAPI & Decision Engine."""
    service = MLIntelligenceService()

    payload = service.analyze_zone(
        zone_id="z04",
        actual_power_kw=5.60,
        current_occupancy=0,
        timestamp=datetime(2026, 10, 5, 14, 15),
        outdoor_temp_c=33.2,
        current_temp_c=21.2,
        target_setpoint_c=21.0,
        lighting_pct=100.0,
    )

    # Validate output structure
    assert "occupancy_forecast" in payload
    assert "energy_baseline" in payload
    assert "anomaly" in payload
    assert "decision_engine_context" in payload

    # Check evidence discipline
    assert payload["occupancy_forecast"]["evidence"] == "MODELLED"
    assert payload["energy_baseline"]["evidence"] == "MODELLED"
    assert payload["anomaly"]["evidence"] == "MODELLED"

    # Check Decision Engine handoff fields
    dec = payload["decision_engine_context"]
    assert dec["eligible_for_setback"] is True
    assert dec["recommended_action"] == "SETBACK_OPPORTUNITY"
    assert dec["potential_kw_savings"] > 2.0
