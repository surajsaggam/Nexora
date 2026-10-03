"""
NEXORA ML Intelligence Layer - Feature Engineering Pipeline
Prepares time-series features for:
1. Occupancy Forecasting (+60m horizon)
2. Energy Baseline Modeling (ASHRAE Guideline 14 compliant)
3. Anomaly Residual Detection
"""

import math
from typing import List, Tuple
import numpy as np
import pandas as pd

# Zone encoding map for deterministic numeric encoding
ZONE_ID_MAP = {
    "z01": 1,
    "z02": 2,
    "z03": 3,
    "z04": 4,
    "z05": 5,
    "z06": 6,
    "z07": 7,
    "z08": 8,
}

OCCUPANCY_FEATURE_COLS = [
    "occupancy",
    "occ_lag_15m",
    "occ_lag_30m",
    "occ_lag_60m",
    "occ_roll_mean_1h",
    "occ_roll_std_1h",
    "hour",
    "minute",
    "day_of_week",
    "is_weekend",
    "hour_sin",
    "hour_cos",
    "zone_idx",
    "max_capacity",
    "area_sqm",
]

ENERGY_FEATURE_COLS = [
    "occupancy",
    "outdoor_temp_c",
    "outdoor_humidity_pct",
    "solar_irradiance_w_per_m2",
    "hour",
    "minute",
    "day_of_week",
    "is_weekend",
    "hour_sin",
    "hour_cos",
    "zone_idx",
    "area_sqm",
    "max_capacity",
]


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """Adds cyclical time and calendar features."""
    df = df.copy()
    if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df["timestamp"] = pd.to_datetime(df["timestamp"])

    df["hour"] = df["timestamp"].dt.hour
    df["minute"] = df["timestamp"].dt.minute
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # Cyclical hour encoding
    hour_float = df["hour"] + df["minute"] / 60.0
    df["hour_sin"] = np.sin(2.0 * math.pi * hour_float / 24.0)
    df["hour_cos"] = np.cos(2.0 * math.pi * hour_float / 24.0)

    # Numeric zone index
    if "zone_id" in df.columns:
        df["zone_idx"] = df["zone_id"].map(ZONE_ID_MAP).fillna(0).astype(int)

    return df


def build_occupancy_dataset(
    df: pd.DataFrame,
    forecast_horizon_steps: int = 4,  # 4 * 15m = 60m horizon
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Constructs time-lagged features and target for 60-minute ahead occupancy forecasting.
    Target: occupancy(t + 4 steps)
    """
    df = add_time_features(df)
    df = df.sort_values(["zone_id", "timestamp"]).reset_index(drop=True)

    # Compute lags and target grouped by zone_id
    grouped = df.groupby("zone_id")

    df["target_occ_60m"] = grouped["occupancy"].shift(-forecast_horizon_steps)
    df["occ_lag_15m"] = grouped["occupancy"].shift(1)
    df["occ_lag_30m"] = grouped["occupancy"].shift(2)
    df["occ_lag_60m"] = grouped["occupancy"].shift(4)

    # Rolling 1-hour statistics (4 steps of 15m)
    df["occ_roll_mean_1h"] = grouped["occupancy"].transform(
        lambda s: s.rolling(window=4, min_periods=1).mean()
    )
    df["occ_roll_std_1h"] = grouped["occupancy"].transform(
        lambda s: s.rolling(window=4, min_periods=1).std()
    ).fillna(0.0)

    # Backfill earliest lag steps
    df["occ_lag_15m"] = df["occ_lag_15m"].fillna(df["occupancy"])
    df["occ_lag_30m"] = df["occ_lag_30m"].fillna(df["occupancy"])
    df["occ_lag_60m"] = df["occ_lag_60m"].fillna(df["occupancy"])

    # Drop trailing rows where future target is NaN
    valid_mask = df["target_occ_60m"].notna()
    df_clean = df[valid_mask].copy()

    X = df_clean[OCCUPANCY_FEATURE_COLS]
    y = df_clean["target_occ_60m"]

    return X, y


def build_energy_baseline_dataset(
    df: pd.DataFrame,
    filter_anomalies: bool = True,
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Constructs feature matrix and target for whole-zone electrical power baseline.
    Optionally trains strictly on normal non-anomalous baseline operation to learn true expected load.
    """
    df = add_time_features(df)

    if filter_anomalies and "has_anomaly" in df.columns:
        # Train baseline on clean nominal operation so it learns true un-corrupted expected load
        df_clean = df[~df["has_anomaly"]].copy()
    else:
        df_clean = df.copy()

    X = df_clean[ENERGY_FEATURE_COLS]
    y = df_clean["total_zone_electrical_kw"]

    return X, y


def temporal_train_test_split(
    df: pd.DataFrame,
    train_ratio: float = 0.80,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Splits time-series data chronologically to prevent temporal data leakage.
    First 80% used for model training; remaining 20% reserved for holdout evaluation.
    """
    if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df = df.copy()
        df["timestamp"] = pd.to_datetime(df["timestamp"])

    unique_times = df["timestamp"].drop_duplicates().sort_values()
    split_idx = int(len(unique_times) * train_ratio)
    split_date = unique_times.iloc[split_idx]

    train_df = df[df["timestamp"] < split_date].copy()
    test_df = df[df["timestamp"] >= split_date].copy()

    return train_df, test_df
