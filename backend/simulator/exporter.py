"""
NEXORA Simulation Service - Data Exporter & ML Pipeline Interface
Serializes simulation snapshots into structured DataFrames, CSVs, Parquet files, and JSON payloads.
Prepares datasets for ML forecasting, anomaly detection, and real-time frontend streaming.
Every record is explicitly tagged with evidence="SIMULATED".
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd

from backend.simulator.physics import BuildingSnapshot
from backend.simulator.config import ZONES


def snapshots_to_zone_records(snapshots: List[BuildingSnapshot]) -> List[Dict[str, Any]]:
    """Flattens building snapshots into individual zone-level observation rows."""
    records = []
    for snap in snapshots:
        for zid, zs in snap.zones.items():
            cfg = ZONES[zid]
            records.append({
                "timestamp": snap.timestamp_iso,
                "scenario_id": snap.scenario_id,
                "zone_id": zid,
                "zone_code": cfg.code,
                "zone_name": cfg.name,
                "floor": cfg.floor,
                "area_sqm": cfg.area_sqm,
                "occupancy": zs.occupancy,
                "max_capacity": cfg.max_capacity,
                "temperature_c": zs.temperature_c,
                "target_setpoint_c": zs.target_setpoint_c,
                "co2_ppm": zs.co2_ppm,
                "humidity_pct": zs.humidity_pct,
                "comfort_min_temp": cfg.comfort_band.min_temp,
                "comfort_max_temp": cfg.comfort_band.max_temp,
                "comfort_max_co2": cfg.comfort_band.max_co2,
                "hvac_mode": zs.hvac_mode,
                "fan_speed": zs.fan_speed,
                "cooling_thermal_kw": zs.cooling_thermal_kw,
                "hvac_electrical_kw": zs.hvac_electrical_kw,
                "lighting_level_pct": zs.lighting_level_pct,
                "lighting_electrical_kw": zs.lighting_electrical_kw,
                "equipment_electrical_kw": zs.equipment_electrical_kw,
                "total_zone_electrical_kw": zs.total_zone_electrical_kw,
                "baseline_expected_kw": zs.baseline_expected_kw,
                "variance_kw": round(zs.total_zone_electrical_kw - zs.baseline_expected_kw, 2),
                "outdoor_temp_c": snap.outdoor_temp_c,
                "outdoor_humidity_pct": snap.outdoor_humidity_pct,
                "solar_irradiance_w_per_m2": snap.solar_irradiance_w_per_m2,
                "has_anomaly": zs.has_anomaly,
                "anomaly_description": zs.anomaly_description,
                "evidence": "SIMULATED",  # Strictly labeled as required by AGENTS.md
            })
    return records


def snapshots_to_building_records(snapshots: List[BuildingSnapshot]) -> List[Dict[str, Any]]:
    """Flattens building snapshots into building-level summary rows."""
    records = []
    for snap in snapshots:
        records.append({
            "timestamp": snap.timestamp_iso,
            "scenario_id": snap.scenario_id,
            "outdoor_temp_c": snap.outdoor_temp_c,
            "outdoor_humidity_pct": snap.outdoor_humidity_pct,
            "solar_irradiance_w_per_m2": snap.solar_irradiance_w_per_m2,
            "total_building_occupancy": snap.total_building_occupancy,
            "total_hvac_power_kw": snap.total_hvac_power_kw,
            "total_lighting_power_kw": snap.total_lighting_power_kw,
            "total_equipment_power_kw": snap.total_equipment_power_kw,
            "gross_building_power_kw": snap.gross_building_power_kw,
            "baseline_building_power_kw": snap.baseline_building_power_kw,
            "variance_delta_kw": snap.variance_delta_kw,
            "comfort_compliance_pct": snap.comfort_compliance_pct,
            "iaq_compliance_pct": snap.iaq_compliance_pct,
            "active_anomalies_count": snap.active_anomalies_count,
            "evidence": "SIMULATED",  # Strictly labeled as required by AGENTS.md
        })
    return records


def export_to_dataframes(
    snapshots: List[BuildingSnapshot],
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Converts snapshots into zone-level and building-level pandas DataFrames."""
    zone_records = snapshots_to_zone_records(snapshots)
    building_records = snapshots_to_building_records(snapshots)

    df_zones = pd.DataFrame(zone_records)
    df_building = pd.DataFrame(building_records)

    # Convert timestamps to proper datetime
    df_zones["timestamp"] = pd.to_datetime(df_zones["timestamp"])
    df_building["timestamp"] = pd.to_datetime(df_building["timestamp"])

    return df_zones, df_building


def save_dataset(
    snapshots: List[BuildingSnapshot],
    output_dir: str = "backend/data/simulated",
    prefix: str = "nexora_apex_floor4",
    save_parquet: bool = True,
    save_csv: bool = True,
    save_json_sample: bool = True,
) -> Dict[str, str]:
    """
    Saves simulation dataset to disk for ML model training and evaluation.
    Returns dictionary of generated file paths.
    """
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    df_zones, df_building = export_to_dataframes(snapshots)
    saved_files = {}

    # 1. Building-level dataset
    if save_csv:
        bld_csv = out_path / f"{prefix}_building.csv"
        df_building.to_csv(bld_csv, index=False)
        saved_files["building_csv"] = str(bld_csv)

        zone_csv = out_path / f"{prefix}_zones.csv"
        df_zones.to_csv(zone_csv, index=False)
        saved_files["zones_csv"] = str(zone_csv)

    if save_parquet:
        bld_parquet = out_path / f"{prefix}_building.parquet"
        df_building.to_parquet(bld_parquet, index=False)
        saved_files["building_parquet"] = str(bld_parquet)

        zone_parquet = out_path / f"{prefix}_zones.parquet"
        df_zones.to_parquet(zone_parquet, index=False)
        saved_files["zones_parquet"] = str(zone_parquet)

    # 2. Latest sample JSON for API / frontend streaming contract
    if save_json_sample and len(snapshots) > 0:
        latest = snapshots[-1]
        sample_dict = {
            "timestamp": latest.timestamp_iso,
            "scenario": latest.scenario_id,
            "evidence": latest.evidence,
            "outdoor_temp_c": latest.outdoor_temp_c,
            "gross_building_power_kw": latest.gross_building_power_kw,
            "baseline_building_power_kw": latest.baseline_building_power_kw,
            "variance_delta_kw": latest.variance_delta_kw,
            "comfort_compliance_pct": latest.comfort_compliance_pct,
            "iaq_compliance_pct": latest.iaq_compliance_pct,
            "active_anomalies_count": latest.active_anomalies_count,
            "zones": {
                zid: {
                    "zone_name": zs.zone_id,
                    "temperature": zs.temperature_c,
                    "target_setpoint": zs.target_setpoint_c,
                    "co2": zs.co2_ppm,
                    "humidity": zs.humidity_pct,
                    "occupancy": zs.occupancy,
                    "total_power_kw": zs.total_zone_electrical_kw,
                    "has_anomaly": zs.has_anomaly,
                    "anomaly_desc": zs.anomaly_description,
                    "evidence": zs.evidence,
                }
                for zid, zs in latest.zones.items()
            },
        }
        json_file = out_path / f"{prefix}_sample.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(sample_dict, f, indent=2)
        saved_files["sample_json"] = str(json_file)

    return saved_files
