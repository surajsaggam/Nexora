"""
NEXORA Building Intelligence Platform - Simulation CLI
Command line interface to run simulations, generate ML training data, inspect live telemetry, and verify physical integrity.
Usage:
    python -m backend.simulator.cli run --days 30 --scenario standard
    python -m backend.simulator.cli inspect --file backend/data/simulated/nexora_apex_floor4_zones.csv
    python -m backend.simulator.cli verify
"""

import argparse
from datetime import datetime
import json
import sys
from pathlib import Path
import pandas as pd

from backend.simulator.config import SCENARIOS, ZONES
from backend.simulator.engine import NexoraBuildingSimulator
from backend.simulator.exporter import export_to_dataframes, save_dataset


def cmd_run(args):
    """Executes deterministic batch simulation and saves dataset."""
    print("=" * 70)
    print(" NEXORA BUILDING INTELLIGENCE - SIMULATOR ENGINE")
    print(" Model: Apex Horizon Complex (Floor 4, 1,000 m², 8 Zones)")
    print("=" * 70)
    print(f"Scenario:     {args.scenario} ({SCENARIOS[args.scenario].name})")
    print(f"Duration:     {args.days} days")
    print(f"Resolution:   {args.step_minutes} minutes")
    print(f"Start date:   {args.start_date}")
    print(f"Output dir:   {args.out_dir}")
    print(f"Evidence Tag: SIMULATED (Strictly enforced)")
    print("-" * 70)

    start_dt = datetime.fromisoformat(args.start_date)
    sim = NexoraBuildingSimulator(scenario_id=args.scenario, random_seed=args.seed)

    print("Running physical integration...")
    snapshots = sim.run_simulation(
        start_dt=start_dt,
        days=args.days,
        step_minutes=args.step_minutes,
        inject_anomalies=not args.no_anomalies,
    )

    print(f"Generated {len(snapshots):,} building snapshots.")
    total_zone_timesteps = len(snapshots) * len(ZONES)
    print(f"Generated {total_zone_timesteps:,} zone observation points.")

    saved_files = save_dataset(
        snapshots=snapshots,
        output_dir=args.out_dir,
        prefix=f"nexora_apex_floor4_{args.scenario}",
        save_parquet=True,
        save_csv=True,
        save_json_sample=True,
    )

    print("-" * 70)
    print("Saved Datasets:")
    for key, path in saved_files.items():
        size_kb = Path(path).stat().st_size / 1024.0
        print(f"  • {key:18s}: {path} ({size_kb:.1f} KB)")

    # Print summary statistics
    df_zones, df_bld = export_to_dataframes(snapshots)
    print("-" * 70)
    print("Summary Telemetry (Whole Building):")
    print(f"  Average Gross Power:   {df_bld['gross_building_power_kw'].mean():.2f} kW")
    print(f"  Peak Demand:           {df_bld['gross_building_power_kw'].max():.2f} kW")
    print(f"  Min Basal Load (Night):{df_bld['gross_building_power_kw'].min():.2f} kW")
    print(f"  Avg Comfort Compliant: {df_bld['comfort_compliance_pct'].mean():.1f}%")
    print(f"  Avg IAQ Compliant:     {df_bld['iaq_compliance_pct'].mean():.1f}%")
    print(f"  Total Injected Anomalies Detected: {(df_zones['has_anomaly']).sum():,} zone-hours")
    print("=" * 70)


def cmd_inspect(args):
    """Inspects a generated CSV/JSON simulation file."""
    path = Path(args.file)
    if not path.exists():
        print(f"Error: File not found: {path}")
        sys.exit(1)

    print("=" * 70)
    print(f" INSPECTING DATASET: {path.name}")
    print("=" * 70)

    if path.suffix == ".json":
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(json.dumps(data, indent=2))
        return

    df = pd.read_csv(path)
    print(f"Total Rows:    {len(df):,}")
    print(f"Total Columns: {len(df.columns)}")
    print(f"Columns:       {', '.join(df.columns[:10])}...")
    print(f"Evidence Tag:  {df['evidence'].unique().tolist()}")
    print("-" * 70)

    if "zone_id" in df.columns:
        print("\nZone Telemetry Snapshot (Latest step across 8 zones):")
        latest_ts = df["timestamp"].max()
        latest_df = df[df["timestamp"] == latest_ts][[
            "zone_code", "occupancy", "temperature_c", "target_setpoint_c",
            "co2_ppm", "hvac_electrical_kw", "total_zone_electrical_kw", "has_anomaly"
        ]]
        print(latest_df.to_string(index=False))

        print("\nPer-Zone Averages Across Entire Dataset:")
        agg_df = df.groupby("zone_code").agg(
            mean_occ=("occupancy", "mean"),
            mean_temp=("temperature_c", "mean"),
            mean_co2=("co2_ppm", "mean"),
            mean_power_kw=("total_zone_electrical_kw", "mean"),
            peak_power_kw=("total_zone_electrical_kw", "max"),
        ).round(2)
        print(agg_df.to_string())

    elif "gross_building_power_kw" in df.columns:
        print("\nBuilding Snapshot (Recent 5 rows):")
        cols = ["timestamp", "outdoor_temp_c", "total_building_occupancy", "gross_building_power_kw", "baseline_building_power_kw", "variance_delta_kw"]
        print(df[cols].tail(5).to_string(index=False))

    print("=" * 70)


def cmd_verify(args):
    """Runs automated physical sanity checks on simulation physics."""
    print("=" * 70)
    print(" VERIFYING PHYSICAL SANITY & AGENTS.md CONSTRAINTS")
    print("=" * 70)

    sim = NexoraBuildingSimulator(scenario_id="standard", random_seed=42)
    start_dt = datetime(2026, 10, 5, 0, 0, 0)  # Monday
    snapshots = sim.run_simulation(start_dt=start_dt, days=3, step_minutes=15)
    df_zones, df_bld = export_to_dataframes(snapshots)

    checks_passed = True

    def check(name: str, condition: bool, message: str = ""):
        nonlocal checks_passed
        status = "PASSED" if condition else "FAILED"
        print(f"[{status}] {name}")
        if not condition:
            print(f"       ERROR: {message}")
            checks_passed = False

    # 1. Evidence tagging check
    all_simulated = (df_zones["evidence"] == "SIMULATED").all() and (df_bld["evidence"] == "SIMULATED").all()
    check("Evidence Discipline", all_simulated, "All records must have evidence='SIMULATED'")

    # 2. Temperature physical boundaries (15°C to 35°C)
    t_min, t_max = df_zones["temperature_c"].min(), df_zones["temperature_c"].max()
    check("Temperature Stability", 17.0 <= t_min and t_max <= 32.0, f"Range: {t_min}°C to {t_max}°C")

    # 3. CO2 boundaries (400 ppm to 1600 ppm)
    co2_min, co2_max = df_zones["co2_ppm"].min(), df_zones["co2_ppm"].max()
    check("CO2 Mass Balance", 412.0 <= co2_min and co2_max <= 1400.0, f"Range: {co2_min} to {co2_max} ppm")

    # 4. Non-negative power & realistic range
    p_min, p_max = df_bld["gross_building_power_kw"].min(), df_bld["gross_building_power_kw"].max()
    check("Building Electrical Power", 10.0 <= p_min and p_max <= 80.0, f"Range: {p_min} kW to {p_max} kW")

    # 5. Server room 24/7 cooling check
    server_df = df_zones[df_zones["zone_id"] == "z07"]
    server_temp_max = server_df["temperature_c"].max()
    check("Server Room Thermal Protection", server_temp_max <= 22.0, f"Max temp: {server_temp_max}°C (limit 22.0°C)")

    # 6. Conservation of energy / Power aggregation
    zone_sum = df_zones.groupby("timestamp")["total_zone_electrical_kw"].sum().values
    bld_gross = df_bld.sort_values("timestamp")["gross_building_power_kw"].values
    max_diff = max(abs(zone_sum - bld_gross))
    check("Power Conservation", max_diff < 0.1, f"Max mismatch: {max_diff:.3f} kW")

    # 7. Anomaly Injection Check
    anomaly_detected = (df_zones["has_anomaly"]).any()
    check("Anomaly Scenario Injection", anomaly_detected, "Z04 Conference Suite B anomaly occurred")

    print("-" * 70)
    if checks_passed:
        print("ALL PHYSICAL SANITY CHECKS PASSED SUCCESSFULLY.")
    else:
        print("SOME CHECKS FAILED. REVIEW ERRORS ABOVE.")
        sys.exit(1)
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="NEXORA Building Simulation Service")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # run command
    run_parser = subparsers.add_parser("run", help="Run simulation and export dataset")
    run_parser.add_argument("--days", type=int, default=30, help="Simulation duration in days (default: 30)")
    run_parser.add_argument("--step-minutes", type=int, default=15, help="Timestep in minutes (default: 15)")
    run_parser.add_argument("--scenario", type=str, default="standard", choices=list(SCENARIOS.keys()))
    run_parser.add_argument("--start-date", type=str, default="2026-08-01T00:00:00")
    run_parser.add_argument("--out-dir", type=str, default="backend/data/simulated")
    run_parser.add_argument("--seed", type=int, default=42)
    run_parser.add_argument("--no-anomalies", action="store_true")

    # inspect command
    inspect_parser = subparsers.add_parser("inspect", help="Inspect a generated dataset")
    inspect_parser.add_argument("--file", type=str, required=True, help="Path to CSV or JSON file")

    # verify command
    subparsers.add_parser("verify", help="Run automated physics sanity tests")

    args = parser.parse_args()
    if args.command == "run":
        cmd_run(args)
    elif args.command == "inspect":
        cmd_inspect(args)
    elif args.command == "verify":
        cmd_verify(args)


if __name__ == "__main__":
    main()
