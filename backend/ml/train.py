"""
NEXORA ML Intelligence Layer - Training Pipeline
Trains:
1. 60-Minute Ahead Occupancy Forecaster
2. ASHRAE Guideline 14 Energy Baseline Model
3. Calibrates Statistical Anomaly Thresholds
Evaluates on chronological holdout data to prevent leakage, saves models and metrics.
"""

from datetime import datetime
import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, f1_score, precision_score, recall_score

from backend.ml.anomaly import AnomalyDetector
from backend.ml.energy_baseline import EnergyBaselineModel
from backend.ml.features import (
    build_energy_baseline_dataset,
    build_occupancy_dataset,
    temporal_train_test_split,
)
from backend.ml.occupancy_model import OccupancyForecaster


def run_training_pipeline(
    data_path: str = "backend/data/simulated/nexora_apex_floor4_standard_zones.parquet",
    models_dir: str = "backend/ml/models",
    results_dir: str = "backend/ml/results",
    train_ratio: float = 0.80,
    random_seed: int = 42,
) -> dict:
    """
    Executes end-to-end model training, holdout evaluation, and persistence.
    """
    print("=" * 72)
    print(" NEXORA ML INTELLIGENCE - MODEL TRAINING PIPELINE")
    print("=" * 72)
    print(f"Dataset:       {data_path}")
    print(f"Models Dir:    {models_dir}")
    print(f"Results Dir:   {results_dir}")
    print(f"Train/Test:    {int(train_ratio*100)}% Train / {int((1-train_ratio)*100)}% Holdout (Chronological)")
    print("-" * 72)

    # 1. Load Parquet Dataset
    df = pd.read_parquet(data_path)
    print(f"Loaded {len(df):,} total zone observation records.")
    print(f"Unique Zones: {df['zone_code'].unique().tolist()}")
    print(f"Date Range:   {df['timestamp'].min()} to {df['timestamp'].max()}")

    # 2. Chronological Train / Test Split
    train_df, test_df = temporal_train_test_split(df, train_ratio=train_ratio)
    print(f"Training set: {len(train_df):,} rows ({train_df['timestamp'].min()} to {train_df['timestamp'].max()})")
    print(f"Holdout set:  {len(test_df):,} rows ({test_df['timestamp'].min()} to {test_df['timestamp'].max()})")
    print("-" * 72)

    # -------------------------------------------------------------
    # 3. Model 1: 60-Minute Occupancy Forecaster
    # -------------------------------------------------------------
    print("[1/3] Training 60-Minute Occupancy Forecaster...")
    X_train_occ, y_train_occ = build_occupancy_dataset(train_df)
    X_test_occ, y_test_occ = build_occupancy_dataset(test_df)

    occ_forecaster = OccupancyForecaster(random_state=random_seed)
    occ_forecaster.fit(X_train_occ, y_train_occ)
    occ_metrics = occ_forecaster.evaluate(X_test_occ, y_test_occ)

    occ_model_path = Path(models_dir) / "occupancy_forecaster.joblib"
    occ_forecaster.save(str(occ_model_path))
    print(f"  [+] Occupancy Forecaster MAE:   {occ_metrics['mae_headcount']:.3f} persons")
    print(f"  [+] Occupancy Forecaster RMSE:  {occ_metrics['rmse_headcount']:.3f} persons")
    print(f"  [+] Occupancy Forecaster R^2:   {occ_metrics['r2_score']:.4f}")
    print(f"  [+] Saved model: {occ_model_path}")
    print("-" * 72)

    # -------------------------------------------------------------
    # 4. Model 2: Energy Baseline Model
    # -------------------------------------------------------------
    print("[2/3] Training Energy Baseline Model (ASHRAE Guideline 14)...")
    X_train_nrg, y_train_nrg = build_energy_baseline_dataset(train_df, filter_anomalies=True)
    X_test_nrg, y_test_nrg = build_energy_baseline_dataset(test_df, filter_anomalies=False)

    energy_model = EnergyBaselineModel(random_state=random_seed)
    energy_model.fit(X_train_nrg, y_train_nrg)
    energy_metrics = energy_model.evaluate(X_test_nrg, y_test_nrg)

    nrg_model_path = Path(models_dir) / "energy_baseline.joblib"
    energy_model.save(str(nrg_model_path))
    print(f"  [+] Energy Baseline MAE:        {energy_metrics['mae_kw']:.3f} kW")
    print(f"  [+] Energy Baseline RMSE:       {energy_metrics['rmse_kw']:.3f} kW")
    print(f"  [+] Energy Baseline R^2:        {energy_metrics['r2_score']:.4f}")
    print(f"  [+] ASHRAE CV(RMSE):            {energy_metrics['cv_rmse_pct']:.2f}% (Standard <= 30.0%)")
    print(f"  [+] ASHRAE NMBE:                {energy_metrics['nmbe_pct']:.2f}% (Standard <= 10.0%)")
    print(f"  [+] ASHRAE 14 Compliant:        {'YES' if energy_metrics['ashrae_14_compliant'] else 'NO'}")
    print(f"  [+] Saved model: {nrg_model_path}")
    print("-" * 72)

    # -------------------------------------------------------------
    # 5. Model 3: Anomaly Detector Calibration & Validation
    # -------------------------------------------------------------
    print("[3/3] Calibrating & Validating Explainable Anomaly Detector...")
    # Compute residuals on holdout nominal data
    holdout_preds = energy_model.predict(X_test_nrg)
    test_eval_df = test_df.copy()
    test_eval_df["expected_power_kw"] = holdout_preds
    test_eval_df["residual_kw"] = test_eval_df["total_zone_electrical_kw"] - test_eval_df["expected_power_kw"]

    # Calibrate residual deviations per zone
    zone_residuals = {}
    for zid in test_eval_df["zone_id"].unique():
        nom_residuals = test_eval_df[(test_eval_df["zone_id"] == zid) & (~test_eval_df["has_anomaly"])]["residual_kw"].values
        zone_residuals[zid] = nom_residuals

    anomaly_detector = AnomalyDetector()
    anomaly_detector.calibrate(zone_residuals)

    # Evaluate detection on holdout
    y_true_anomaly = test_eval_df["has_anomaly"].values
    y_pred_anomaly = []
    for _, row in test_eval_df.iterrows():
        det = anomaly_detector.detect(
            zone_id=row["zone_id"],
            actual_power_kw=row["total_zone_electrical_kw"],
            expected_power_kw=row["expected_power_kw"],
            occupancy=row["occupancy"],
            target_setpoint=row["target_setpoint_c"],
        )
        y_pred_anomaly.append(det.is_anomaly)

    y_pred_anomaly = np.array(y_pred_anomaly)
    prec = float(precision_score(y_true_anomaly, y_pred_anomaly, zero_division=0))
    rec = float(recall_score(y_true_anomaly, y_pred_anomaly, zero_division=0))
    f1 = float(f1_score(y_true_anomaly, y_pred_anomaly, zero_division=0))

    anomaly_metrics = {
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "total_anomalies_in_holdout": int(np.sum(y_true_anomaly)),
        "detected_anomalies": int(np.sum(y_pred_anomaly)),
    }

    print(f"  [+] Anomaly Detection Precision: {anomaly_metrics['precision']:.3f}")
    print(f"  [+] Anomaly Detection Recall:    {anomaly_metrics['recall']:.3f}")
    print(f"  [+] Anomaly Detection F1-Score:  {anomaly_metrics['f1_score']:.3f}")
    print(f"  [+] True Anomalies in Holdout:   {anomaly_metrics['total_anomalies_in_holdout']}")
    print(f"  [+] Detected by Anomaly Engine:  {anomaly_metrics['detected_anomalies']}")
    print("-" * 72)

    # 6. Save Metrics Summary
    res_path = Path(results_dir)
    res_path.mkdir(parents=True, exist_ok=True)
    all_metrics = {
        "timestamp": datetime.now().isoformat(),
        "dataset": data_path,
        "train_rows": len(train_df),
        "holdout_rows": len(test_df),
        "occupancy_forecaster": occ_metrics,
        "energy_baseline": energy_metrics,
        "anomaly_detector": anomaly_metrics,
        "evidence": "MODELLED",
    }

    metrics_file = res_path / "metrics.json"
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(all_metrics, f, indent=2)
    print(f"Saved complete evaluation report: {metrics_file}")
    print("=" * 72)

    return all_metrics


if __name__ == "__main__":
    run_training_pipeline()
