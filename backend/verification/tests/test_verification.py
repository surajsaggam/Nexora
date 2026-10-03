"""
NEXORA Verification Layer - Unit Tests
Verifies:
1. M&V Calculation: Impact = Adjusted Baseline - Actual (avoided kW, avoided kWh, cost saved INR)
2. Comfort preservation validation (ASHRAE 55 band compliance)
3. IAQ preservation validation (ASHRAE 62.1 CO2 compliance)
4. Successful verification (VERIFIED status)
5. Failed verification (NOT_VERIFIED status on comfort, IAQ, or negative savings)
6. Pending verification (PENDING_VERIFICATION when read-back is awaited)
7. VerificationLedger recording, filtering, and summary calculations
"""

from datetime import datetime
import pytest

from backend.verification.ledger import VerificationLedger
from backend.verification.mv import MVEngine, MVVerificationRecord


@pytest.fixture
def mv_engine():
    return MVEngine(commercial_tariff_inr_per_kwh=9.5)


@pytest.fixture
def ledger():
    led = VerificationLedger()
    led.clear()
    return led


def test_successful_verification_flow(mv_engine):
    """
    Verifies that when comfort and IAQ pass with measurable power reduction,
    the intervention is marked VERIFIED with correct kWh and INR savings.
    """
    before_telemetry = {
        "power_kw": 5.60,
        "temperature_c": 21.2,
        "co2_ppm": 440.0,
    }
    after_telemetry = {
        "power_kw": 3.69,
        "temperature_c": 21.8,
        "co2_ppm": 435.0,
    }

    record = mv_engine.verify_intervention(
        recommendation_id="rec-z04-141500",
        zone_id="Z04-CSB",
        action="HVAC_SETBACK_LIGHTING_DIM",
        before_telemetry=before_telemetry,
        after_telemetry=after_telemetry,
        expected_baseline_kw=1.51,
        duration_hours=0.75,
    )

    assert record.verification_status == "VERIFIED"
    assert record.zone_id == "Z04-CSB"
    assert record.comfort_pass is True
    assert record.iaq_pass is True
    assert record.avoided_kw == 1.91
    assert record.avoided_kwh == round(1.91 * 0.75, 2)
    assert record.cost_saved_inr == round(record.avoided_kwh * 9.5, 2)
    assert record.evidence == "SIMULATED"


def test_comfort_violation_marks_not_verified(mv_engine):
    """
    Verifies that if temperature floats outside the zone's comfort band (e.g. 26.2°C > 25.5°C limit),
    the intervention is strictly marked NOT_VERIFIED despite energy savings.
    """
    before_telemetry = {"power_kw": 5.60, "temperature_c": 21.2, "co2_ppm": 440.0}
    # Temperature rose to 26.2°C, violating Conference Suite B max_temp (25.5°C)
    after_telemetry = {"power_kw": 2.50, "temperature_c": 26.2, "co2_ppm": 450.0}

    record = mv_engine.verify_intervention(
        recommendation_id="rec-z04-comfort-fail",
        zone_id="Z04-CSB",
        action="HVAC_SETBACK",
        before_telemetry=before_telemetry,
        after_telemetry=after_telemetry,
        expected_baseline_kw=1.51,
        duration_hours=0.75,
    )

    assert record.verification_status == "NOT_VERIFIED"
    assert record.comfort_pass is False
    assert record.iaq_pass is True
    assert "comfort violation" in record.verification_notes.lower()


def test_iaq_violation_marks_not_verified(mv_engine):
    """
    Verifies that if CO2 exceeds the zone's IAQ limit (e.g. 1050 ppm > 950 ppm limit),
    the intervention is strictly marked NOT_VERIFIED.
    """
    before_telemetry = {"power_kw": 5.60, "temperature_c": 21.2, "co2_ppm": 440.0}
    # CO2 spiked to 1050 ppm
    after_telemetry = {"power_kw": 3.50, "temperature_c": 22.0, "co2_ppm": 1050.0}

    record = mv_engine.verify_intervention(
        recommendation_id="rec-z04-iaq-fail",
        zone_id="Z04-CSB",
        action="HVAC_SETBACK",
        before_telemetry=before_telemetry,
        after_telemetry=after_telemetry,
        expected_baseline_kw=1.51,
        duration_hours=0.75,
    )

    assert record.verification_status == "NOT_VERIFIED"
    assert record.comfort_pass is True
    assert record.iaq_pass is False
    assert "iaq violation" in record.verification_notes.lower()


def test_zero_or_negative_savings_marks_not_verified(mv_engine):
    """Verifies that an intervention with no power drop is marked NOT_VERIFIED."""
    before_telemetry = {"power_kw": 3.00, "temperature_c": 21.5, "co2_ppm": 440.0}
    after_telemetry = {"power_kw": 3.20, "temperature_c": 21.5, "co2_ppm": 440.0}

    record = mv_engine.verify_intervention(
        recommendation_id="rec-z04-no-savings",
        zone_id="Z04-CSB",
        action="HVAC_SETBACK",
        before_telemetry=before_telemetry,
        after_telemetry=after_telemetry,
        expected_baseline_kw=1.51,
        duration_hours=0.75,
    )

    assert record.verification_status == "NOT_VERIFIED"
    assert record.avoided_kw == 0.0


def test_pending_verification_when_readback_none(mv_engine):
    """Verifies PENDING_VERIFICATION returned when post-action telemetry is awaiting capture."""
    before_telemetry = {"power_kw": 5.60, "temperature_c": 21.2, "co2_ppm": 440.0}

    record = mv_engine.verify_intervention(
        recommendation_id="rec-z04-pending",
        zone_id="Z04-CSB",
        action="HVAC_SETBACK",
        before_telemetry=before_telemetry,
        after_telemetry=None,
        expected_baseline_kw=1.51,
    )

    assert record.verification_status == "PENDING_VERIFICATION"
    assert record.avoided_kw == 0.0
    assert "pending" in record.verification_notes.lower()


def test_verification_ledger_storage_and_summary(ledger, mv_engine):
    """Verifies appending records, filtering, and calculating cumulative M&V ledger summaries."""
    rec1 = mv_engine.verify_intervention(
        recommendation_id="rec-001",
        zone_id="Z04-CSB",
        action="HVAC_SETBACK_LIGHTING_DIM",
        before_telemetry={"power_kw": 5.60, "temperature_c": 21.2, "co2_ppm": 440.0},
        after_telemetry={"power_kw": 3.69, "temperature_c": 21.8, "co2_ppm": 435.0},
        expected_baseline_kw=1.51,
        duration_hours=0.75,
    )
    rec2 = mv_engine.verify_intervention(
        recommendation_id="rec-002",
        zone_id="Z01-SOW",
        action="HVAC_SETBACK",
        before_telemetry={"power_kw": 12.00, "temperature_c": 22.0, "co2_ppm": 500.0},
        after_telemetry={"power_kw": 9.80, "temperature_c": 22.8, "co2_ppm": 510.0},
        expected_baseline_kw=8.50,
        duration_hours=1.0,
    )

    ledger.record_intervention(rec1)
    ledger.record_intervention(rec2)

    assert len(ledger.get_records()) == 2
    assert len(ledger.get_records(zone_id="Z04-CSB")) == 1
    assert ledger.get_record("ver-001") is not None

    summary = ledger.get_summary(gross_building_power_kw=32.0, baseline_building_power_kw=36.0)
    assert summary["interventions_count"] == 2
    assert summary["verified_count"] == 2
    assert summary["failed_count"] == 0
    assert summary["total_verified_load_reduction_kw"] == round(1.91 + 2.20, 2)
    assert summary["evidence"] == "SIMULATED"
