"""
NEXORA Simulation Service - Zone Occupancy Engine
Generates realistic, schedule-driven and stochastic occupant presence across all 8 zones.
Models working hours, lunch rushes, meeting reservations, early vacations, and weekend profiles.
"""

import math
import random
from datetime import datetime
from typing import Dict, NamedTuple
from backend.simulator.config import ZONES, ZoneConfig


class ZoneOccupancy(NamedTuple):
    current_occupancy: int
    predicted_next_hour: int
    trend: str  # "RISING" | "FALLING" | "STABLE" | "VACANT"
    is_scheduled_meeting: bool
    is_early_vacated: bool  # Flag for early-departure anomaly


def _get_base_profile(zone_id: str, hour: float, is_weekend: bool) -> float:
    """Returns normalized base occupancy fraction [0.0, 1.0] for time of day."""
    if is_weekend:
        # Weekends have minimal skeleton presence (e.g. 5% max in workspaces, 0 in meeting rooms)
        if zone_id in ("z01", "z02") and 10.0 <= hour <= 16.0:
            return 0.08
        if zone_id == "z08" and 09.0 <= hour <= 14.0:
            return 0.15
        return 0.0

    # Weekdays: Profile per zone type
    if zone_id == "z01":  # South Open Workspace
        if 8.0 <= hour < 9.0:
            return 0.3 * (hour - 8.0)
        elif 9.0 <= hour < 12.5:
            return 0.75 + 0.1 * math.sin((hour - 9.0) * 0.8)
        elif 12.5 <= hour < 14.0:
            return 0.45  # Lunch dip
        elif 14.0 <= hour < 17.5:
            return 0.80
        elif 17.5 <= hour < 19.5:
            return 0.80 * (1.0 - (hour - 17.5) / 2.0)
        return 0.0

    elif zone_id == "z02":  # North Engineering Lab
        if 8.5 <= hour < 9.5:
            return 0.35 * (hour - 8.5)
        elif 9.5 <= hour < 13.0:
            return 0.82
        elif 13.0 <= hour < 14.0:
            return 0.55  # Lunch break
        elif 14.0 <= hour < 18.5:
            return 0.85
        elif 18.5 <= hour < 20.5:
            return 0.85 * (1.0 - (hour - 18.5) / 2.0)
        return 0.0

    elif zone_id == "z03":  # Executive Boardroom (discrete meeting slots)
        # Morning meeting 10:00 - 11:45
        if 10.0 <= hour < 11.75:
            return 0.75
        # Afternoon strategy meeting 14:00 - 15:30
        elif 14.0 <= hour < 15.5:
            return 0.80
        # Late review 16:30 - 17:30
        elif 16.5 <= hour < 17.5:
            return 0.50
        return 0.0

    elif zone_id == "z04":  # Conference Suite B
        # Morning standup 09:30 - 10:30
        if 9.5 <= hour < 10.5:
            return 0.60
        # Midday meeting 11:30 - 12:30
        elif 11.5 <= hour < 12.5:
            return 0.70
        # Early-departure meeting 13:30 - 14:30 scheduled
        # Notice: Real occupants leave at 13:48!
        elif 13.5 <= hour < 14.5:
            return 0.65
        return 0.0

    elif zone_id == "z05":  # Central Collaboration Atrium
        if 9.0 <= hour < 12.0:
            return 0.45
        elif 12.0 <= hour < 14.0:
            return 0.65  # Lunch gathering
        elif 14.0 <= hour < 17.0:
            return 0.50
        elif 17.0 <= hour < 18.5:
            return 0.25
        return 0.0

    elif zone_id == "z06":  # Cafeteria & Breakout Lounge
        if 8.3 <= hour < 10.0:
            return 0.20  # Morning coffee
        elif 12.0 <= hour < 14.0:
            return 0.88  # Peak lunch rush
        elif 15.5 <= hour < 17.0:
            return 0.45  # Afternoon tea
        elif 17.0 <= hour < 19.0:
            return 0.15
        return 0.0

    elif zone_id == "z07":  # Server Room & UPS Hub
        # Server room has almost zero occupants
        if 11.0 <= hour < 11.3:
            return 0.50  # IT engineer daily inspection (1 person)
        return 0.0

    elif zone_id == "z08":  # East Facilities & Reception
        if 8.0 <= hour < 19.0:
            return 0.50  # Steady 3 occupants (reception + facility staff)
        return 0.0

    return 0.0


def compute_zone_occupancy(
    zone_id: str,
    dt: datetime,
    occupancy_multiplier: float = 1.0,
    rng: random.Random = None,
    inject_suite_b_anomaly: bool = True,
) -> ZoneOccupancy:
    """
    Computes deterministic/reproducible occupancy for a zone at a specific datetime.
    """
    if rng is None:
        # Deterministic seed based on timestamp & zone_id
        seed_val = int(dt.timestamp()) ^ hash(zone_id)
        rng = random.Random(seed_val)

    cfg = ZONES[zone_id]
    is_weekend = dt.weekday() >= 5
    hour_float = dt.hour + dt.minute / 60.0

    # Base fraction
    fraction = _get_base_profile(zone_id, hour_float, is_weekend)

    # Future hour fraction for trend and prediction
    future_hour = (hour_float + 1.0) % 24.0
    future_fraction = _get_base_profile(zone_id, future_hour, is_weekend)

    # Anomaly injection for Conference Suite B (Z04):
    # Scheduled meeting from 13:30 to 14:30, but occupants left early at 13:48!
    is_early_vacated = False
    is_scheduled = fraction > 0.05

    if inject_suite_b_anomaly and zone_id == "z04" and not is_weekend:
        if 13.80 <= hour_float < 14.80:  # ~13:48 to 14:48
            is_early_vacated = True
            fraction = 0.0  # Room is actually completely empty!

    # Calculate integer headcounts with slight noise
    if fraction <= 0.01:
        current_occ = 0
    else:
        # Base count scaled by multiplier
        scaled_count = cfg.max_capacity * fraction * occupancy_multiplier
        # Add slight realistic stochastic jitter (±1 person)
        jitter = rng.uniform(-0.8, 0.8)
        current_occ = max(1, min(cfg.max_capacity, int(round(scaled_count + jitter))))

    # Predicted next hour count
    predicted_count = max(0, min(cfg.max_capacity, int(round(cfg.max_capacity * future_fraction * occupancy_multiplier))))

    # Trend derivation
    if current_occ == 0 and predicted_count == 0:
        trend = "VACANT"
    elif predicted_count > current_occ + 2:
        trend = "RISING"
    elif predicted_count < current_occ - 2:
        trend = "FALLING"
    else:
        trend = "STABLE"

    return ZoneOccupancy(
        current_occupancy=current_occ,
        predicted_next_hour=predicted_count,
        trend=trend,
        is_scheduled_meeting=is_scheduled,
        is_early_vacated=is_early_vacated,
    )


def compute_all_zones_occupancy(
    dt: datetime,
    occupancy_multiplier: float = 1.0,
    rng: random.Random = None,
    inject_suite_b_anomaly: bool = True,
) -> Dict[str, ZoneOccupancy]:
    """Computes occupancy state across all 8 zones for a given timestamp."""
    return {
        zid: compute_zone_occupancy(
            zone_id=zid,
            dt=dt,
            occupancy_multiplier=occupancy_multiplier,
            rng=rng,
            inject_suite_b_anomaly=inject_suite_b_anomaly,
        )
        for zid in ZONES
    }
