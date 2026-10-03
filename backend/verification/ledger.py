"""
NEXORA Measurement & Verification (M&V) Ledger
Thread-safe, auditable ledger recording all executed building interventions and verified impacts.
"""

from datetime import datetime
import threading
from typing import Any, Dict, List, Optional

from backend.verification.mv import MVVerificationRecord


class VerificationLedger:
    """
    Persistent in-memory M&V Ledger for building-level and zone-level intervention records.
    Provides verifiable proof of impact under ASHRAE Guideline 14 standards.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._records: List[MVVerificationRecord] = []

    def record_intervention(self, record: MVVerificationRecord) -> MVVerificationRecord:
        """Appends a new verified intervention to the ledger."""
        with self._lock:
            # Prevent duplicate records for the same intervention ID
            self._records = [r for r in self._records if r.id != record.id]
            self._records.append(record)
            return record

    def get_records(
        self,
        zone_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[MVVerificationRecord]:
        """Returns filtered list of verification records."""
        with self._lock:
            records = list(self._records)
            if zone_id:
                zid_norm = zone_id.strip().lower()
                records = [
                    r for r in records
                    if r.zone_id.lower() == zid_norm or zid_norm in r.zone_id.lower()
                ]
            if status:
                records = [r for r in records if r.verification_status == status]
            return records

    def get_record(self, record_id: str) -> Optional[MVVerificationRecord]:
        """Looks up a single record by record ID or recommendation ID."""
        with self._lock:
            for r in self._records:
                if r.id == record_id or r.recommendation_id == record_id:
                    return r
            return None

    def get_summary(
        self,
        gross_building_power_kw: float = 34.5,
        baseline_building_power_kw: float = 36.5,
        comfort_compliance_pct: float = 100.0,
        iaq_compliance_pct: float = 100.0,
        active_anomalies_count: int = 0,
    ) -> Dict[str, Any]:
        """
        Calculates cumulative M&V metrics across all verified interventions.
        """
        with self._lock:
            verified_records = [r for r in self._records if r.verification_status == "VERIFIED"]
            failed_records = [r for r in self._records if r.verification_status == "NOT_VERIFIED"]

            total_avoided_kw = round(sum(r.avoided_kw for r in verified_records), 2)
            total_avoided_kwh = round(sum(r.avoided_kwh for r in verified_records), 2)
            total_cost_saved = round(sum(r.cost_saved_inr for r in verified_records), 2)

            return {
                "total_verified_load_reduction_kw": total_avoided_kw,
                "total_avoided_energy_kwh": total_avoided_kwh,
                "total_cost_savings_inr": total_cost_saved,
                "interventions_count": len(self._records),
                "verified_count": len(verified_records),
                "failed_count": len(failed_records),
                "comfort_compliance_pct": comfort_compliance_pct,
                "iaq_compliance_pct": iaq_compliance_pct,
                "active_anomalies_count": active_anomalies_count,
                "gross_building_power_kw": gross_building_power_kw,
                "baseline_building_power_kw": baseline_building_power_kw,
                "variance_delta_kw": round(gross_building_power_kw - baseline_building_power_kw, 2),
                "verification_records": [r.to_dict() for r in self._records],
                "evidence": "SIMULATED",
            }

    def clear(self):
        """Clears all records in the ledger (useful for test resets)."""
        with self._lock:
            self._records.clear()
