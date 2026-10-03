"""
NEXORA Peak Event / Demand Response Simulation Layer
Simulates realistic building demand response events when building demand
approaches contractual or operational capacity limits.
Evidence Discipline: Strictly SIMULATED.
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.simulation.peak_event import (
        PeakEventManager,
        PeakEventRecord,
        PeakEventStatus,
    )


def __getattr__(name: str):
    if name in ("PeakEventManager", "PeakEventRecord", "PeakEventStatus"):
        from backend.simulation import peak_event
        return getattr(peak_event, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = [
    "PeakEventManager",
    "PeakEventRecord",
    "PeakEventStatus",
]
