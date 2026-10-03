"""
NEXORA Building Simulation Service
8-Zone First-Principles Physics & Synthetic Telemetry Generator
"""

from backend.simulator.config import ZONES, SCENARIOS, ZoneConfig, SimulationScenario
from backend.simulator.engine import NexoraBuildingSimulator
from backend.simulator.physics import BuildingSnapshot, ZoneState
from backend.simulator.weather import compute_weather, WeatherState
from backend.simulator.occupancy import compute_zone_occupancy, compute_all_zones_occupancy
from backend.simulator.exporter import export_to_dataframes, save_dataset

__all__ = [
    "ZONES",
    "SCENARIOS",
    "ZoneConfig",
    "SimulationScenario",
    "NexoraBuildingSimulator",
    "BuildingSnapshot",
    "ZoneState",
    "compute_weather",
    "WeatherState",
    "compute_zone_occupancy",
    "compute_all_zones_occupancy",
    "export_to_dataframes",
    "save_dataset",
]
