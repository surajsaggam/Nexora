"""
NEXORA Building Intelligence Platform - Simulation Configuration
Model for Apex Horizon Complex (Floor 4 - 1,000 m², 8 Zones)
Conforms to Smart_Buildings_Final_Solution_Context.md and AGENTS.md.
All generated data must be explicitly flagged with evidence="SIMULATED".
"""

from dataclasses import dataclass, field
from typing import Dict, List, Literal, Optional

EvidenceType = Literal["SIMULATED", "MEASURED", "ASSUMED"]
HVACMode = Literal["COOLING", "STANDBY", "SETBACK", "OFF"]
FanSpeed = Literal["OFF", "LOW", "MED", "HIGH", "AUTO"]
GridStress = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]


@dataclass(frozen=True)
class ComfortBand:
    min_temp: float  # °C
    max_temp: float  # °C
    max_co2: float  # ppm
    min_humidity: float = 40.0  # %
    max_humidity: float = 65.0  # %


@dataclass(frozen=True)
class ZoneConfig:
    id: str
    name: str
    code: str
    floor: int
    area_sqm: float
    max_capacity: int
    comfort_band: ComfortBand
    base_setpoint: float
    equipment_base_heat_kw: float  # Internal plug load / server heat
    max_cooling_kw: float          # Peak thermal cooling capacity
    installed_lighting_kw: float   # Peak lighting electrical power
    thermal_capacitance_kwh_per_c: float  # Building thermal mass (C_th)
    envelope_ua_kw_per_c: float    # UA value of walls/glazing (conductance to outdoor)
    air_volume_m3: float           # Zone volume (area * 3.0m ceiling)
    min_fresh_air_m3_per_s: float  # Minimum baseline fresh air ventilation
    fresh_air_per_person_m3_per_s: float = 0.0085  # ASHRAE 62.1 standard: ~8.5 L/s/person


@dataclass(frozen=True)
class SimulationScenario:
    id: str
    name: str
    description: str
    outdoor_base_temp: float
    outdoor_peak_temp: float
    grid_stress: GridStress
    occupancy_multiplier: float
    peak_start_hour: int = 14
    peak_end_hour: int = 18


# 8 Defined Zones for Apex Horizon Complex (Floor 4, total 1,000 m²)
ZONES: Dict[str, ZoneConfig] = {
    "z01": ZoneConfig(
        id="z01",
        name="South Open Workspace",
        code="Z01-SOW",
        floor=4,
        area_sqm=280.0,
        max_capacity=32,
        comfort_band=ComfortBand(min_temp=21.0, max_temp=25.0, max_co2=950.0),
        base_setpoint=22.5,
        equipment_base_heat_kw=2.2,
        max_cooling_kw=18.0,
        installed_lighting_kw=2.1,
        thermal_capacitance_kwh_per_c=14.0,
        envelope_ua_kw_per_c=0.48,  # High southern solar exposure
        air_volume_m3=840.0,
        min_fresh_air_m3_per_s=0.12,
    ),
    "z02": ZoneConfig(
        id="z02",
        name="North Engineering Lab",
        code="Z02-NEL",
        floor=4,
        area_sqm=220.0,
        max_capacity=24,
        comfort_band=ComfortBand(min_temp=20.5, max_temp=24.5, max_co2=900.0),
        base_setpoint=22.0,
        equipment_base_heat_kw=3.5,  # Workstations & lab electronics
        max_cooling_kw=16.0,
        installed_lighting_kw=1.7,
        thermal_capacitance_kwh_per_c=11.5,
        envelope_ua_kw_per_c=0.35,
        air_volume_m3=660.0,
        min_fresh_air_m3_per_s=0.10,
    ),
    "z03": ZoneConfig(
        id="z03",
        name="Executive Boardroom",
        code="Z03-EBR",
        floor=4,
        area_sqm=85.0,
        max_capacity=16,
        comfort_band=ComfortBand(min_temp=21.0, max_temp=25.0, max_co2=900.0),
        base_setpoint=22.0,
        equipment_base_heat_kw=0.8,
        max_cooling_kw=8.5,
        installed_lighting_kw=0.8,
        thermal_capacitance_kwh_per_c=4.5,
        envelope_ua_kw_per_c=0.16,
        air_volume_m3=255.0,
        min_fresh_air_m3_per_s=0.06,
    ),
    "z04": ZoneConfig(
        id="z04",
        name="Conference Suite B",
        code="Z04-CSB",
        floor=4,
        area_sqm=75.0,
        max_capacity=12,
        comfort_band=ComfortBand(min_temp=21.5, max_temp=25.5, max_co2=950.0),
        base_setpoint=21.0,
        equipment_base_heat_kw=0.6,
        max_cooling_kw=7.5,
        installed_lighting_kw=0.8,
        thermal_capacitance_kwh_per_c=4.0,
        envelope_ua_kw_per_c=0.14,
        air_volume_m3=225.0,
        min_fresh_air_m3_per_s=0.05,
    ),
    "z05": ZoneConfig(
        id="z05",
        name="Central Collaboration Atrium",
        code="Z05-CCA",
        floor=4,
        area_sqm=140.0,
        max_capacity=20,
        comfort_band=ComfortBand(min_temp=21.5, max_temp=25.5, max_co2=1000.0),
        base_setpoint=23.5,
        equipment_base_heat_kw=1.0,
        max_cooling_kw=11.0,
        installed_lighting_kw=1.4,
        thermal_capacitance_kwh_per_c=8.0,
        envelope_ua_kw_per_c=0.22,
        air_volume_m3=420.0,
        min_fresh_air_m3_per_s=0.08,
    ),
    "z06": ZoneConfig(
        id="z06",
        name="Cafeteria & Breakout Lounge",
        code="Z06-CBL",
        floor=4,
        area_sqm=110.0,
        max_capacity=25,
        comfort_band=ComfortBand(min_temp=21.0, max_temp=25.5, max_co2=1000.0),
        base_setpoint=23.0,
        equipment_base_heat_kw=2.0,  # Coffee machines, refrigerators
        max_cooling_kw=10.0,
        installed_lighting_kw=1.2,
        thermal_capacitance_kwh_per_c=6.0,
        envelope_ua_kw_per_c=0.20,
        air_volume_m3=330.0,
        min_fresh_air_m3_per_s=0.09,
    ),
    "z07": ZoneConfig(
        id="z07",
        name="Server Room & UPS Hub",
        code="Z07-SRU",
        floor=4,
        area_sqm=40.0,
        max_capacity=2,
        comfort_band=ComfortBand(min_temp=18.0, max_temp=22.0, max_co2=800.0),
        base_setpoint=19.5,
        equipment_base_heat_kw=3.5,  # Constant 24/7 server heat dissipation
        max_cooling_kw=8.0,
        installed_lighting_kw=0.3,
        thermal_capacitance_kwh_per_c=2.2,
        envelope_ua_kw_per_c=0.08,   # Insulated interior zone
        air_volume_m3=120.0,
        min_fresh_air_m3_per_s=0.02,
    ),
    "z08": ZoneConfig(
        id="z08",
        name="East Facilities & Reception",
        code="Z08-EFR",
        floor=4,
        area_sqm=50.0,
        max_capacity=6,
        comfort_band=ComfortBand(min_temp=21.0, max_temp=25.0, max_co2=900.0),
        base_setpoint=23.0,
        equipment_base_heat_kw=0.5,
        max_cooling_kw=5.0,
        installed_lighting_kw=0.5,
        thermal_capacitance_kwh_per_c=3.0,
        envelope_ua_kw_per_c=0.12,
        air_volume_m3=150.0,
        min_fresh_air_m3_per_s=0.04,
    ),
}

# Building Level Constants
BUILDING_TOTAL_AREA_SQM = 1000.0
BUILDING_FLOORS = 1  # Prototype scope is Floor 4
BASE_CHILLER_COP = 3.6  # Standard water-cooled chiller COP at 32°C ambient
OUTDOOR_BASE_CO2_PPM = 412.0  # Atmospheric CO2 baseline
HUMAN_METABOLIC_HEAT_KW = 0.115  # ~115 W sensible+latent heat per seated office worker
HUMAN_CO2_GEN_L_PER_S = 0.0052  # ~18.7 L/h CO2 exhaled per person at office activity
LIGHTING_HEAT_FRACTION = 0.85  # 85% of lighting power converts to indoor heat

# Standard Simulation Scenarios
SCENARIOS: Dict[str, SimulationScenario] = {
    "standard": SimulationScenario(
        id="standard",
        name="Standard Workday Baseline",
        description="Typical weekday schedule with moderate cooling demand (32°C ambient) and normal meetings.",
        outdoor_base_temp=26.0,
        outdoor_peak_temp=33.5,
        grid_stress="LOW",
        occupancy_multiplier=1.0,
    ),
    "summer_peak": SimulationScenario(
        id="summer_peak",
        name="Extreme Summer Grid Peak (39°C)",
        description="High thermal load with peak utility demand penalties. Extreme stress on chillers.",
        outdoor_base_temp=29.0,
        outdoor_peak_temp=39.5,
        grid_stress="CRITICAL",
        occupancy_multiplier=1.1,
    ),
    "demand_response": SimulationScenario(
        id="demand_response",
        name="Active Grid Demand Response Event",
        description="Utility dispatched 15 kW load-shedding signal. Automatic pre-cooling & flexible setback.",
        outdoor_base_temp=28.0,
        outdoor_peak_temp=35.0,
        grid_stress="CRITICAL",
        occupancy_multiplier=0.9,
    ),
    "remote_friday": SimulationScenario(
        id="remote_friday",
        name="Hybrid Remote Low-Load Workday",
        description="Reduced 40% building occupancy. Deep setback opportunities in unoccupied open zones.",
        outdoor_base_temp=25.0,
        outdoor_peak_temp=31.0,
        grid_stress="LOW",
        occupancy_multiplier=0.45,
    ),
}
