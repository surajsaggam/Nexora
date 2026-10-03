"""
NEXORA ML Intelligence Layer - 60-Minute Occupancy Forecaster
Predicts zone headcount 1 hour into the future to enable proactive HVAC pre-cooling and setback.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional
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

from backend.ml.features import OCCUPANCY_FEATURE_COLS, ZONE_ID_MAP


@dataclass
class OccupancyForecastResult:
    zone_id: str
    current_occupancy: int
    predicted_occupancy_next_hour: int
    predicted_occupancy_float: float
    confidence_score: float  # Percentage [0.0, 100.0%]
    trend: str               # "RISING" | "FALLING" | "STABLE" | "VACANT"
    evidence: str = "MODELLED"


class OccupancyForecaster:
    """
    Gradient boosted regression model for 60-minute ahead occupancy forecasting.
    """

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        if HAS_LIGHTGBM:
            self.model = lgb.LGBMRegressor(
                n_estimators=150,
                learning_rate=0.05,
                num_leaves=31,
                min_child_samples=20,
                subsample=0.85,
                colsample_bytree=0.85,
                random_state=random_state,
                verbose=-1,
            )
        else:
            self.model = HistGradientBoostingRegressor(
                max_iter=150,
                learning_rate=0.05,
                max_leaf_nodes=31,
                random_state=random_state,
            )
        self.is_trained = False
        self.holdout_mae: float = 0.85  # Default baseline uncertainty

    def fit(self, X: pd.DataFrame, y: pd.Series):
        """Fits model on training features and targets."""
        self.model.fit(X[OCCUPANCY_FEATURE_COLS], y)
        self.is_trained = True

    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, float]:
        """Evaluates model performance against holdout test set."""
        if not self.is_trained:
            raise RuntimeError("Model must be trained before evaluation.")

        preds = self.predict(X_test)
        mae = float(mean_absolute_error(y_test, preds))
        rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
        r2 = float(r2_score(y_test, preds))

        self.holdout_mae = mae

        return {
            "mae_headcount": round(mae, 3),
            "rmse_headcount": round(rmse, 3),
            "r2_score": round(r2, 4),
            "holdout_samples": len(y_test),
        }

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Predicts future occupancy bounded by non-negativity and max capacity."""
        if not self.is_trained:
            raise RuntimeError("Model must be trained before predicting.")

        raw_preds = self.model.predict(X[OCCUPANCY_FEATURE_COLS])
        # Physical bounding: headcount >= 0 and <= max_capacity
        max_caps = X["max_capacity"].values if "max_capacity" in X.columns else 40.0
        bounded_preds = np.clip(raw_preds, 0.0, max_caps)
        return bounded_preds

    def predict_single(
        self,
        zone_id: str,
        current_occ: int,
        occ_lag_15m: int,
        occ_lag_30m: int,
        occ_lag_60m: int,
        occ_roll_mean_1h: float,
        occ_roll_std_1h: float,
        hour: int,
        minute: int,
        day_of_week: int,
        is_weekend: int,
        max_capacity: int,
        area_sqm: float,
    ) -> OccupancyForecastResult:
        """Single-observation inference helper for real-time edge/API evaluation."""
        hour_float = hour + minute / 60.0
        hour_sin = np.sin(2.0 * np.pi * hour_float / 24.0)
        hour_cos = np.cos(2.0 * np.pi * hour_float / 24.0)
        zone_idx = ZONE_ID_MAP.get(zone_id, 0)

        feature_dict = {
            "occupancy": [current_occ],
            "occ_lag_15m": [occ_lag_15m],
            "occ_lag_30m": [occ_lag_30m],
            "occ_lag_60m": [occ_lag_60m],
            "occ_roll_mean_1h": [occ_roll_mean_1h],
            "occ_roll_std_1h": [occ_roll_std_1h],
            "hour": [hour],
            "minute": [minute],
            "day_of_week": [day_of_week],
            "is_weekend": [is_weekend],
            "hour_sin": [hour_sin],
            "hour_cos": [hour_cos],
            "zone_idx": [zone_idx],
            "max_capacity": [max_capacity],
            "area_sqm": [area_sqm],
        }

        X_single = pd.DataFrame(feature_dict)
        pred_float = float(self.predict(X_single)[0])
        pred_int = int(round(pred_float))

        # Confidence metric derivation:
        # High confidence when model holdout MAE is small relative to capacity
        rel_error = self.holdout_mae / max(4.0, float(max_capacity))
        confidence = max(65.0, min(98.5, round((1.0 - rel_error) * 100.0, 1)))

        # Trend derivation
        if current_occ == 0 and pred_int == 0:
            trend = "VACANT"
        elif pred_int > current_occ + 1:
            trend = "RISING"
        elif pred_int < current_occ - 1:
            trend = "FALLING"
        else:
            trend = "STABLE"

        return OccupancyForecastResult(
            zone_id=zone_id,
            current_occupancy=current_occ,
            predicted_occupancy_next_hour=pred_int,
            predicted_occupancy_float=round(pred_float, 2),
            confidence_score=confidence,
            trend=trend,
            evidence="MODELLED",
        )

    def save(self, filepath: str = "backend/ml/models/occupancy_forecaster.joblib"):
        """Saves model weights and holdout metrics to disk."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)

    @classmethod
    def load(cls, filepath: str = "backend/ml/models/occupancy_forecaster.joblib") -> "OccupancyForecaster":
        """Loads trained model from disk."""
        return joblib.load(filepath)
