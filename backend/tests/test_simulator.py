"""
NEXORA Simulation Service - Automated Physics & Unit Test Suite
Verifies:
1. Physical bounds and conservation laws (energy, mass balance)
2. 8-Zone spatial and capacity parameters (total 1,000 m²)
3. Evidence discipline: All simulated outputs are strictly labeled "SIMULATED"
4. Diurnal weather and solar curves
5. Occupancy schedule and early-departure anomaly behavior
6. Batch simulation execution and dataset generation
"""

from datetime import datetime, timedelta
import pytest
import pandas as pd

from backend.simulator.config import (
    BUILDING_TOTAL_AREA_SQM,
    SCENARIOS,
    ZONES,
)
from backend.simulator.engine import NexoraBuildingSimulator
from backend.simulator.exporter import export_to_dataframes
from backend.simulator.occupancy import compute_all_zones_occupancy, compute_zone_occupancy
from backend.simulator.physics import compute_chiller_cop, compute_fan_electrical_kw
from backend.simulator.weather import compute_weather


def test_zone_definitions_and_total_area():
    """Confirms all 8 zones match the project specification and total 1,000 m²."""
    assert len(ZONES) == 8
    total_area = sum(z.area_sqm for z in ZONES.values())
    assert abs(total_area - BUILDING_TOTAL_AREA_SQM) < 1e-4

    # Verify key zones exist
    assert "z01" in ZONES  # South Open Workspace
    assert "z04" in ZONES  # Conference Suite B
    assert "z07" in ZONES  # Server Room


def test_weather_diurnal_cycle():
    """Verifies diurnal cycle minimum at dawn (~05:30) and peak at afternoon (~14:30)."""
    base_date = datetime(2026, 10, 5, 0, 0)
    w_dawn = compute_weather(base_date + timedelta(hours=5.5))
    w_afternoon = compute_weather(base_date + timedelta(hours=14.5))
    w_night = compute_weather(base_date + timedelta(hours=23.0))

    # Afternoon must be hotter than dawn
    assert w_afternoon.outdoor_temp_c > w_dawn.outdoor_temp_c
    # Night solar irradiance must be 0
    assert w_night.solar_irradiance_w_per_m2 == 0.0
    # Noon solar irradiance must be positive
    w_noon = compute_weather(base_date + timedelta(hours=12.5))
    assert w_noon.solar_irradiance_w_per_m2 > 500.0


def test_occupancy_profiles_and_anomaly():
    """Tests realistic occupancy headcounts and the Z04 early departure anomaly."""
    # Weekday 11:00 (active working hours for workspace)
    weekday_active = datetime(2026, 10, 5, 11, 0)  # Monday
    occ_map = compute_all_zones_occupancy(weekday_active)
    assert occ_map["z01"].current_occupancy > 10  # Workspace active

    # Server room is vacant at 14:00 (outside brief inspection)
    occ_afternoon = compute_all_zones_occupancy(datetime(2026, 10, 5, 14, 0))
    assert occ_afternoon["z07"].current_occupancy == 0  # Server room empty

    # Conference Suite B Anomaly: At 14:15, meeting left early -> headcount is 0
    anomaly_dt = datetime(2026, 10, 5, 14, 15)
    occ_anomaly = compute_zone_occupancy("z04", anomaly_dt, inject_suite_b_anomaly=True)
    assert occ_anomaly.is_early_vacated is True
    assert occ_anomaly.current_occupancy == 0


def test_chiller_cop_degradation():
    """Tests that chiller COP decreases as ambient temperature increases."""
    cop_mild = compute_chiller_cop(28.0)
    cop_hot = compute_chiller_cop(38.0)
    assert cop_mild > cop_hot
    assert 2.0 <= cop_hot <= 5.0


def test_fan_affinity_laws():
    """Tests that fan power scales non-linearly with fan speed."""
    cfg = ZONES["z01"]
    p_off = compute_fan_electrical_kw(cfg, "OFF")
    p_low = compute_fan_electrical_kw(cfg, "LOW")
    p_high = compute_fan_electrical_kw(cfg, "HIGH")

    assert p_off == 0.0
    assert p_high > p_low * 2.0  # High should be significantly greater than low


def test_simulator_single_step():
    """Tests a single discrete physics integration step."""
    sim = NexoraBuildingSimulator(scenario_id="standard", random_seed=42)
    step_dt = datetime(2026, 10, 5, 14, 0)
    snap = sim.step(step_dt, dt_hours=0.25)

    assert snap.evidence == "SIMULATED"
    assert snap.gross_building_power_kw > 0.0
    assert 18.0 <= snap.outdoor_temp_c <= 45.0
    assert len(snap.zones) == 8

    # Check Z04 early departure anomaly trigger
    z4 = snap.zones["z04"]
    assert z4.evidence == "SIMULATED"
    assert z4.has_anomaly is True
    assert "early" in z4.anomaly_description.lower()


def test_energy_conservation_and_power_balance():
    """Verifies that the whole building power equals the exact sum of all 8 zones."""
    sim = NexoraBuildingSimulator(scenario_id="standard", random_seed=101)
    start_dt = datetime(2026, 10, 5, 8, 0)
    snapshots = sim.run_simulation(start_dt=start_dt, days=1, step_minutes=15)

    df_zones, df_bld = export_to_dataframes(snapshots)

    # Check evidence discipline on every single row
    assert (df_zones["evidence"] == "SIMULATED").all()
    assert (df_bld["evidence"] == "SIMULATED").all()

    # Sum of zone power across all timestamps must match building gross power
    zone_sum = df_zones.groupby("timestamp")["total_zone_electrical_kw"].sum().values
    bld_gross = df_bld.sort_values("timestamp")["gross_building_power_kw"].values

    diffs = abs(zone_sum - bld_gross)
    assert diffs.max() < 0.05  # Within float rounding tolerance (0.05 kW)


def test_thermal_and_iaq_bounds():
    """Verifies that temperatures and CO2 levels stay within realistic physical office bounds."""
    sim = NexoraBuildingSimulator(scenario_id="summer_peak", random_seed=77)
    start_dt = datetime(2026, 8, 3, 0, 0)
    snapshots = sim.run_simulation(start_dt=start_dt, days=2, step_minutes=15)

    df_zones, _ = export_to_dataframes(snapshots)

    # Temperatures must be bounded
    min_temp = df_zones["temperature_c"].min()
    max_temp = df_zones["temperature_c"].max()
    assert 18.0 <= min_temp, f"Too cold: {min_temp}"
    assert max_temp <= 28.5, f"Too hot: {max_temp}"

    # CO2 must stay within atmospheric minimum (412) and upper limit
    min_co2 = df_zones["co2_ppm"].min()
    max_co2 = df_zones["co2_ppm"].max()
    assert min_co2 >= 412.0
    assert max_co2 <= 1300.0


def test_server_room_critical_protection():
    """Verifies server room (Z07) is maintained cool 24/7 despite 3.5 kW continuous heat dissipation."""
    sim = NexoraBuildingSimulator(scenario_id="summer_peak", random_seed=99)
    start_dt = datetime(2026, 8, 3, 0, 0)
    snapshots = sim.run_simulation(start_dt=start_dt, days=2, step_minutes=15)

    df_zones, _ = export_to_dataframes(snapshots)
    server_df = df_zones[df_zones["zone_id"] == "z07"]

    # Server room temp must never breach 22.0°C upper comfort limit
    assert server_df["temperature_c"].max() <= 22.0
