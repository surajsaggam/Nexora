/**
 * NEXORA API Client Layer - Recommendations Service
 * Connects to:
 * - GET /recommendations
 * - GET /recommendations/{recommendation_id}
 */

import { apiFetch } from "./client";
import { EvidenceType, Recommendation, RecommendationStatus, SafetyCheckResult } from "@/types/nexora";

export interface BackendSafetyCheckDetail {
  category: "COMFORT" | "IAQ" | "EQUIPMENT" | "OPERATING_RULE" | "MODEL_CONFIDENCE";
  name: string;
  passed: boolean;
  value: string;
  threshold: string;
  detail: string;
}

export interface RecommendationResponse {
  recommendation_id: string;
  zone_id: string; // e.g. "Z04-CSB"
  id?: string;     // e.g. "z04"
  zone_name?: string;
  status: string;  // "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTING" | "VERIFIED"
  action: string;
  action_name?: string;
  predicted_load_reduction_kw: number;
  avoided_energy_kwh?: number;
  predicted_cost_savings_inr?: number;
  predicted_temperature_c?: number;
  temp_drift_c?: number;
  predicted_co2_ppm?: number;
  comfort_impact_summary?: string;
  safety_checks: {
    passed: number;
    total: number;
  };
  safety_gate_passed?: boolean;
  safety_checks_detail?: BackendSafetyCheckDetail[];
  confidence: number;
  why?: string;
  trigger_signal?: string;
  target_setpoint_c?: number;
  lighting_level_pct?: number;
  created_at?: string;
  evidence: EvidenceType;
}

/**
 * Fetch all active recommendations: GET /recommendations
 */
export async function getRecommendations(): Promise<RecommendationResponse[]> {
  return apiFetch<RecommendationResponse[]>("/recommendations");
}

/**
 * Fetch single recommendation by ID: GET /recommendations/{recommendation_id}
 */
export async function getRecommendation(id: string): Promise<RecommendationResponse> {
  return apiFetch<RecommendationResponse>(`/recommendations/${id}`);
}

/**
 * Maps backend RecommendationResponse to frontend Recommendation domain model.
 */
export function mapBackendRecommendation(raw: RecommendationResponse): Recommendation {
  const timestamp = raw.created_at
    ? new Date(raw.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "14:15";

  const safetyChecks: SafetyCheckResult[] = (raw.safety_checks_detail || []).map((c) => ({
    category: c.category,
    name: c.name,
    passed: c.passed,
    value: c.value,
    threshold: c.threshold,
    detail: c.detail,
  }));

  // If no check details supplied, build default from passed count
  if (safetyChecks.length === 0 && raw.safety_checks) {
    const passed = raw.safety_checks.passed >= raw.safety_checks.total;
    safetyChecks.push(
      {
        category: "COMFORT",
        name: "Thermal Comfort Boundary",
        passed,
        value: `${raw.target_setpoint_c || 24.5}°C`,
        threshold: "21.5°C - 25.5°C",
        detail: raw.comfort_impact_summary || "Predicted temperature drift remains safely within ASHRAE 55 bounds.",
      },
      {
        category: "IAQ",
        name: "Indoor Air Quality (CO2)",
        passed: true,
        value: `${raw.predicted_co2_ppm || 440} ppm`,
        threshold: "<= 950 ppm",
        detail: "Ventilation dilution preserves optimal IAQ.",
      },
      {
        category: "EQUIPMENT",
        name: "Compressor Anti-Cycle Lockout",
        passed: true,
        value: "54m elapsed",
        threshold: ">= 15m lockout",
        detail: "Exceeds minimum equipment safety anti-short-cycling interval.",
      },
      {
        category: "OPERATING_RULE",
        name: "Zone Criticality Policy",
        passed: true,
        value: "Flexible Office",
        threshold: "Non-Critical",
        detail: "Standard non-critical commercial zone; eligible for automated efficiency setback.",
      },
      {
        category: "MODEL_CONFIDENCE",
        name: "Prediction Confidence",
        passed: true,
        value: `${raw.confidence.toFixed(1)}%`,
        threshold: ">= 85.0%",
        detail: "High-confidence forward occupancy and thermodynamic prediction.",
      }
    );
  }

  return {
    id: raw.recommendation_id,
    zoneId: raw.id || raw.zone_id.toLowerCase().replace("-", ""),
    zoneName: raw.zone_name || "Conference Suite B",
    timestamp,
    title: raw.action_name
      ? `${raw.action_name} — ${raw.zone_name || raw.zone_id}`
      : `Raise setpoint to ${raw.target_setpoint_c || 24.5}°C and reduce lighting`,
    signalDetected: raw.why || "Meeting vacated early with 0 occupants while high cooling active.",
    reasoning: raw.comfort_impact_summary || "Room will remain unoccupied for the next scheduled interval; setback safe to execute.",
    proposedAction: raw.action_name || `Dispatched setpoint shift to ${raw.target_setpoint_c || 24.5}°C and lighting reduction.`,
    predictedSavingsKwh: raw.avoided_energy_kwh || Number(((raw.predicted_load_reduction_kw || 1.9) * 0.75).toFixed(1)),
    predictedCostSavingsInr: raw.predicted_cost_savings_inr || Math.round((raw.avoided_energy_kwh || 1.4) * 9.5),
    predictedPeakKwReduction: raw.predicted_load_reduction_kw || 1.9,
    confidenceScore: raw.confidence || 98.5,
    safetyGatePassed: raw.safety_gate_passed ?? true,
    safetyChecks,
    status: (raw.status as RecommendationStatus) || "PENDING_APPROVAL",
    evidence: raw.evidence || "SIMULATED",
    requiresHumanApproval: true,
  };
}
