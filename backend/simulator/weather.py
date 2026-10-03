"""
NEXORA Simulation Service - Outdoor Weather & Climate Model
Generates realistic, physically consistent diurnal weather curves (temperature, solar radiation, humidity).
"""

import math
from datetime import datetime
from typing import NamedTuple
from backend.simulator.config import SimulationScenario, SCENARIOS


class WeatherState(NamedTuple):
    outdoor_temp_c: float
    solar_irradiance_w_per_m2: float
    outdoor_humidity_pct: float


def compute_weather(
    dt: datetime,
    scenario: SimulationScenario = SCENARIOS["standard"],
    day_variation_c: float = 0.0,
) -> WeatherState:
    """
    Computes deterministic outdoor weather for a given timestamp and scenario.
    Follows standard meteorological diurnal cycle:
    - Min temp occurs around 05:30 (solar sunrise)
    - Max temp occurs around 14:30 (thermal lag after solar noon)
    - Solar radiation peaks at 12:30
    """
    hour_float = dt.hour + dt.minute / 60.0 + dt.second / 3600.0

    # Solar Irradiance Model (W/m²)
    # Sunrise at 06:00, sunset at 18:30
    sunrise = 6.0
    sunset = 18.5
    if sunrise <= hour_float <= sunset:
        day_progress = (hour_float - sunrise) / (sunset - sunrise)
        solar_peak = 850.0  # W/m² peak clear-sky irradiance
        solar_irradiance = solar_peak * math.sin(day_progress * math.pi)
    else:
        solar_irradiance = 0.0

    # Diurnal Temperature Model
    # Min at 05:30, Max at 14:30 (phase shift = 14.5 - 6 = 8.5)
    t_min = scenario.outdoor_base_temp + day_variation_c
    t_max = scenario.outdoor_peak_temp + day_variation_c
    amplitude = (t_max - t_min) / 2.0
    mean_temp = (t_max + t_min) / 2.0

    # Sine curve with peak at 14.5 hr: sin((t - 8.5)/24 * 2pi) has peak at 14.5
    phase_rad = ((hour_float - 8.5) / 24.0) * 2.0 * math.pi
    outdoor_temp = mean_temp + amplitude * math.sin(phase_rad)

    # Relative Humidity Model (%): Inversely correlated with temperature
    # Typically 75% at coldest dawn, drops to ~42% during peak afternoon heat
    temp_norm = (outdoor_temp - t_min) / max(1.0, (t_max - t_min))
    outdoor_humidity = 76.0 - (temp_norm * 34.0)

    return WeatherState(
        outdoor_temp_c=round(outdoor_temp, 2),
        solar_irradiance_w_per_m2=round(solar_irradiance, 1),
        outdoor_humidity_pct=round(outdoor_humidity, 1),
    )
