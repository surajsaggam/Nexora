"""
NEXORA Decision Engine - End-to-End Decision Flow Demo
Scenario: Zone 04 (Conference Suite B) Early Departure at 14:15 IST
Demonstrates the full closed loop:
ML Detection → Candidate Actions → Digital Twin What-If → Safety Gate → Recommendation.
"""

from datetime import datetime
import json
from backend.decision_engine.engine import DecisionEngine


def run_zone04_decision_demo():
    print("=" * 76)
    print(" NEXORA DECISION ENGINE - END-TO-END DEMO")
    print(" Scenario: Zone 04 (Conference Suite B) Early Vacation")
    print("=" * 76)

    # Initialize Decision Engine
    engine = DecisionEngine()

    # Telemetry at 14:15 IST: Meeting vacated early; 0 occupants, 5.60 kW load
    telemetry = {
        "zone_id": "z04",
        "actual_power_kw": 5.60,
        "current_occupancy": 0,
        "timestamp": datetime(2026, 10, 5, 14, 15),
        "current_temp_c": 21.2,
        "current_setpoint_c": 21.0,
        "current_co2_ppm": 420.0,
        "current_humidity_pct": 46.0,
        "lighting_pct": 100.0,
        "outdoor_temp_c": 33.2,
        "outdoor_humidity_pct": 46.0,
        "solar_irradiance_w_per_m2": 720.0,
        "elapsed_since_last_actuation_min": 54.0,
        "is_executive_lock": False,
        "lookahead_minutes": 45,
    }

    result = engine.process_zone(**telemetry)

    # 1. Output Decision Summary
    print(f"Zone:              Conference Suite B (Z04-CSB) - Floor 4 (75 m2)")
    print(f"Timestamp:         {result.decision_timestamp}")
    print("-" * 76)
    print(f"WHY:               {result.why_explanation}")
    print(f"ACTION:            {result.action_explanation}")
    print(f"EXPECTED IMPACT:   {result.impact_explanation}")
    print(f"SAFETY:            {result.safety_explanation}")
    print("-" * 76)

    # 2. Digital Twin What-If Comparison
    print("DIGITAL TWIN WHAT-IF EVALUATION (45-Minute Horizon):")
    print(f"{'Candidate Action':<35} | {'Pred Temp':<10} | {'Power (kW)':<10} | {'Reduction':<10} | {'Avoided kWh':<11} | {'Safe?'}")
    print("-" * 92)
    for cand in result.evaluated_candidates:
        wi = cand.what_if
        safe_str = "YES (5/5)" if cand.safety.all_passed else f"NO ({cand.safety.passed_count}/5)"
        print(
            f"{cand.action.name:<35} | "
            f"{wi.predicted_temperature_c:>5.1f}C     | "
            f"{wi.predicted_power_kw:>6.2f} kW | "
            f"-{wi.estimated_load_reduction_kw:>5.2f} kW | "
            f"{wi.avoided_energy_kwh:>6.2f} kWh  | "
            f"{safe_str}"
        )
    print("-" * 92)

    # 3. Selected Action Safety Checks Detail
    chosen_cand = next(c for c in result.evaluated_candidates if c.action.id == result.selected_action.id)
    print(f"\nSAFETY GATE AUDIT FOR SELECTED ACTION [{chosen_cand.action.name}]:")
    for chk in chosen_cand.safety.checks:
        status_sym = "[PASS]" if chk.passed else "[FAIL]"
        print(f"  {status_sym} {chk.name:<30} Value: {chk.value:<18} Threshold: {chk.threshold}")
        print(f"         Detail: {chk.detail}")

    # 4. Human-in-the-Loop Recommendation Object
    if result.recommendation:
        rec = result.recommendation
        print("\n" + "=" * 76)
        print(" HUMAN-IN-THE-LOOP RECOMMENDATION OBJECT DISPATCHED:")
        print("=" * 76)
        print(f"Recommendation ID:   {rec.recommendation_id}")
        print(f"Status:              {rec.status}")
        print(f"Requires FM Signoff: {rec.requires_human_approval}")
        print(f"ML Confidence:       {rec.confidence:.1f}%")
        print(f"Predicted Load Drop: -{rec.predicted_impact.predicted_load_reduction_kw:.2f} kW")
        print(f"Avoided Energy (45m): {rec.predicted_impact.avoided_energy_kwh:.2f} kWh")
        print(f"Estimated Savings:   Rs. {rec.predicted_impact.predicted_cost_savings_inr:.2f} INR")
        print(f"Thermal Response:    Drifts from {rec.current_state.temperature_c:.1f}C to {rec.predicted_impact.predicted_temperature_c:.1f}C ({rec.predicted_impact.temp_drift_c:+.1f}C drift)")
        print(f"Comfort Impact:      {rec.predicted_impact.comfort_impact_summary}")
        print(f"Evidence Tag:        {rec.evidence}")
        print("=" * 76)

    return result


if __name__ == "__main__":
    run_zone04_decision_demo()
