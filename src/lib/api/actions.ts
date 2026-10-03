/**
 * NEXORA API Client Layer - Actions Service
 * Connects to:
 * - POST /actions/{recommendation_id}/approve
 * - POST /actions/{recommendation_id}/reject
 */

import { apiFetch } from "./client";
import { EvidenceType } from "@/types/nexora";

export interface TelemetrySnapshot {
  zone_id: string;
  temperature_c: number;
  target_setpoint_c: number;
  co2_ppm: number;
  humidity_pct: number;
  lighting_pct: number;
  total_power_kw: number;
  hvac_power_kw?: number;
  lighting_power_kw?: number;
  occupancy: number;
  evidence: EvidenceType;
}

export interface ActionApprovalResponse {
  recommendation_id: string;
  zone_id: string;
  status: "APPROVED";
  action: string;
  executed_at: string;
  before_telemetry: TelemetrySnapshot;
  after_telemetry: TelemetrySnapshot;
  predicted_impact: {
    predicted_load_reduction_kw: number;
    avoided_energy_kwh: number;
    predicted_cost_savings_inr: number;
    predicted_temperature_c: number;
    temp_drift_c: number;
    predicted_co2_ppm: number;
    comfort_impact_summary: string;
    evidence: EvidenceType;
  };
  actual_impact: {
    actual_load_reduction_kw: number;
    avoided_energy_kwh: number;
    actual_cost_savings_inr: number;
    evidence: EvidenceType;
  };
  verification: {
    status: "VERIFIED" | "NOT_VERIFIED";
    comfort_preserved: boolean;
    iaq_preserved: boolean;
    delta_kw: number;
    variance_pct: number;
    evidence: EvidenceType;
  };
  evidence: EvidenceType;
}

export interface ActionRejectionResponse {
  recommendation_id: string;
  zone_id: string;
  status: "REJECTED";
  reason: string;
  building_state_modified: boolean;
  timestamp: string;
  evidence: EvidenceType;
}

/**
 * Approve a safety-gated recommendation and dispatch physical control intervention:
 * POST /actions/{recommendation_id}/approve
 */
export async function approveAction(
  recommendationId: string
): Promise<ActionApprovalResponse> {
  return apiFetch<ActionApprovalResponse>(
    `/actions/${recommendationId}/approve`,
    {
      method: "POST",
    }
  );
}

/**
 * Reject a recommendation without modifying building state:
 * POST /actions/{recommendation_id}/reject
 */
export async function rejectAction(
  recommendationId: string,
  reason?: string
): Promise<ActionRejectionResponse> {
  return apiFetch<ActionRejectionResponse>(
    `/actions/${recommendationId}/reject`,
    {
      method: "POST",
      body: JSON.stringify({
        reason: reason || "Facility manager rejected action",
      }),
    }
  );
}
