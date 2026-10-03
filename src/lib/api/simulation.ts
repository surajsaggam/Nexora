/**
 * NEXORA API Client Layer - Simulation & Peak Event Service
 * Connects to:
 * - POST /sim/peak-event
 * - GET  /sim/peak-event
 * - POST /sim/peak-event/stop
 * - POST /sim/reset
 * - GET  /sim/scenarios
 */

import { apiFetch } from "./client";
import { EvidenceType } from "@/types/nexora";

export interface PeakEventActionExecuted {
  zone_id: string;
  zone_name: string;
  action: string;
  target_setpoint_c: number;
  lighting_pct: number;
  status: string;
  load_reduction_kw: number;
  safety_passed?: boolean;
  detail?: string;
}

export interface PeakEventResponse {
  event_id: string;
  status: "ACTIVE" | "STOPPED" | "COMPLETED" | "IDLE";
  target_limit_kw: number;
  baseline_peak_kw: number;
  current_peak_kw: number;
  peak_reduction_kw: number;
  participating_zones: string[];
  protected_zones: string[];
  actions_executed: PeakEventActionExecuted[];
  comfort_pass: boolean;
  iaq_pass: boolean;
  evidence: EvidenceType;
  duration_minutes?: number;
  started_at?: string;
  ended_at?: string;
  scenario_id?: string;
  high_demand_detected?: boolean;
  utilization_pct?: number;
}

export interface SimulationResetResponse {
  status: string;
  timestamp: string;
  active_recommendations: number;
  evidence: EvidenceType;
}

export interface ScenarioItem {
  id: string;
  name: string;
  description: string;
  outdoor_base_temp: number;
  outdoor_peak_temp: number;
  grid_stress: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence: EvidenceType;
}

/**
 * Trigger a peak demand response event: POST /sim/peak-event
 */
export async function triggerPeakEvent(params?: {
  duration_minutes?: number;
  target_limit_kw?: number;
  scenario_id?: string;
}): Promise<PeakEventResponse> {
  return apiFetch<PeakEventResponse>("/sim/peak-event", {
    method: "POST",
    body: JSON.stringify({
      duration_minutes: params?.duration_minutes ?? 120,
      target_limit_kw: params?.target_limit_kw ?? 60.0,
      scenario_id: params?.scenario_id ?? "summer_peak",
    }),
  });
}

/**
 * Get active or latest peak event status: GET /sim/peak-event
 */
export async function getPeakEvent(): Promise<PeakEventResponse> {
  return apiFetch<PeakEventResponse>("/sim/peak-event");
}

/**
 * Stop active peak demand response event: POST /sim/peak-event/stop
 */
export async function stopPeakEvent(): Promise<PeakEventResponse> {
  return apiFetch<PeakEventResponse>("/sim/peak-event/stop", {
    method: "POST",
  });
}

/**
 * Reset simulation state to baseline Monday 14:15: POST /sim/reset
 */
export async function resetSimulation(): Promise<SimulationResetResponse> {
  return apiFetch<SimulationResetResponse>("/sim/reset", {
    method: "POST",
  });
}

/**
 * List available simulation scenarios: GET /sim/scenarios
 */
export async function getScenarios(): Promise<ScenarioItem[]> {
  return apiFetch<ScenarioItem[]>("/sim/scenarios");
}
