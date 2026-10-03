"""
NEXORA ML Intelligence Layer - Energy Baseline Model
Predicts expected electrical power from weather, occupancy, and operational schedule.
Evaluates compliance against ASHRAE Guideline 14 & IPMVP Option C standards (CV(RMSE) and NMBE).
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except ImportError:
    from sklearn.ensemble import HistGradientBoostingRegressor
    HAS_LIGHTGBM = False

from backend.ml.features import ENERGY_FEATURE_COLS, ZONE_ID_MAP


@dataclass
class EnergyBaselineResult:
    zone_id: str
    expected_power_kw: float
    actual_power_kw: float
    variance_delta_kw: float  # Actual - Expected
    variance_pct: float       # (Actual - Expected) / Expected * 100
    evidence: str = "MODELLED"


class EnergyBaselineModel:
    """
    Gradient boosted baseline regression model predicting expected zone electrical load.
    Trained on non-anomalous baseline telemetry to learn true expected physical consumption.
    """

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        if HAS_LIGHTGBM:
            self.model = lgb.LGBMRegressor(
                n_estimators=160,
                learning_rate=0.04,
                num_leaves=31,
                min_child_samples=20,
                subsample=0.85,
                colsample_bytree=0.85,
                random_state=random_state,
                verbose=-1,
            )
        else:
            self.model = HistGradientBoostingRegressor(
                max_iter=160,
                learning_rate=0.04,
                max_leaf_nodes=31,
                random_state=random_state,
            )
        self.is_trained = False
        self.mean_test_kw: float = 4.0

    def fit(self, X: pd.DataFrame, y: pd.Series):
        """Fits model on training features and targets."""
        self.model.fit(X[ENERGY_FEATURE_COLS], y)
        self.is_trained = True

    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, float]:
        """
        Evaluates model accuracy against holdout data conforming to ASHRAE Guideline 14:
        - CV(RMSE) <= 30.0%
        - |NMBE| <= 10.0%
        - R² >= 0.75
        """
        if not self.is_trained:
            raise RuntimeError("Model must be trained before evaluation.")

        preds = self.predict(X_test)
        mae = float(mean_absolute_error(y_test, preds))
        rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
        r2 = float(r2_score(y_test, preds))

        mean_actual = float(y_test.mean())
        self.mean_test_kw = mean_actual

        # ASHRAE Guideline 14 metrics:
        # Coefficient of Variation of RMSE: CV(RMSE) = RMSE / y_mean * 100
        cv_rmse = (rmse / max(0.1, mean_actual)) * 100.0
        # Normalized Mean Bias Error: NMBE = sum(actual - pred) / sum(actual) * 100
        nmbe = (float(np.sum(y_test - preds)) / max(0.1, float(np.sum(y_test)))) * 100.0

        return {
            "mae_kw": round(mae, 3),
            "rmse_kw": round(rmse, 3),
            "r2_score": round(r2, 4),
            "cv_rmse_pct": round(cv_rmse, 2),  # Target: <= 30%
            "nmbe_pct": round(nmbe, 2),        # Target: |NMBE| <= 10%
            "ashrae_14_compliant": cv_rmse <= 30.0 and abs(nmbe) <= 10.0,
            "holdout_samples": len(y_test),
        }

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Predicts expected power (kW) strictly bounded by non-negativity."""
        if not self.is_trained:
            raise RuntimeError("Model must be trained before predicting.")

        raw_preds = self.model.predict(X[ENERGY_FEATURE_COLS])
        # Power cannot be negative
        return np.maximum(0.2, raw_preds)

    def predict_single(
        self,
        zone_id: str,
        actual_power_kw: float,
        occupancy: int,
        outdoor_temp_c: float,
        outdoor_humidity_pct: float,
        solar_irradiance_w_per_m2: float,
        hour: int,
        minute: int,
        day_of_week: int,
        is_weekend: int,
        area_sqm: float,
        max_capacity: int,
    ) -> EnergyBaselineResult:
        """Single-observation baseline prediction and variance calculation."""
        hour_float = hour + minute / 60.0
        hour_sin = np.sin(2.0 * np.pi * hour_float / 24.0)
        hour_cos = np.cos(2.0 * np.pi * hour_float / 24.0)
        zone_idx = ZONE_ID_MAP.get(zone_id, 0)

        feature_dict = {
            "occupancy": [occupancy],
            "outdoor_temp_c": [outdoor_temp_c],
            "outdoor_humidity_pct": [outdoor_humidity_pct],
            "solar_irradiance_w_per_m2": [solar_irradiance_w_per_m2],
            "hour": [hour],
            "minute": [minute],
            "day_of_week": [day_of_week],
            "is_weekend": [is_weekend],
            "hour_sin": [hour_sin],
            "hour_cos": [hour_cos],
            "zone_idx": [zone_idx],
            "area_sqm": [area_sqm],
            "max_capacity": [max_capacity],
        }

        X_single = pd.DataFrame(feature_dict)
        expected_kw = round(float(self.predict(X_single)[0]), 2)
        variance_kw = round(actual_power_kw - expected_kw, 2)
        variance_pct = round((variance_kw / max(0.5, expected_kw)) * 100.0, 1)

        return EnergyBaselineResult(
            zone_id=zone_id,
            expected_power_kw=expected_kw,
            actual_power_kw=round(actual_power_kw, 2),
            variance_delta_kw=variance_kw,
            variance_pct=variance_pct,
            evidence="MODELLED",
        )

    def save(self, filepath: str = "backend/ml/models/energy_baseline.joblib"):
        """Saves baseline model to disk."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)

    @classmethod
    def load(cls, filepath: str = "backend/ml/models/energy_baseline.joblib") -> "EnergyBaselineModel":
        """Loads baseline model from disk."""
        return joblib.load(filepath)
