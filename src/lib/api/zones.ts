/**
 * NEXORA API Client Layer - Zones Service
 * Connects to:
 * - GET /zones
 * - GET /zones/{zone_id}/state
 */

import { apiFetch } from "./client";
import { EvidenceType, HVACMode, ZoneData } from "@/types/nexora";

export interface ZoneSummaryResponse {
  zone_id: string; // e.g. "Z04-CSB"
  name: string;
  occupancy: number;
  temperature_c: number;
  co2_ppm: number;
  power_kw: number;
  evidence: EvidenceType;
  id?: string; // "z04"
  code?: string;
  floor?: number;
  target_setpoint_c?: number;
  humidity_pct?: number;
  hvac_mode?: string;
  fan_speed?: string;
  lighting_pct?: number;
  has_anomaly?: boolean;
  anomaly_description?: string;
}

export interface ZoneDetailResponse {
  zone_id: string;
  id: string;
  name: string;
  code: string;
  floor: number;
  area_sqm: number;
  max_capacity: number;
  occupancy: number;
  predicted_occupancy_next_hour: number;
  occupancy_trend: "RISING" | "STABLE" | "FALLING" | "VACANT";
  temperature_c: number;
  target_setpoint_c: number;
  co2_ppm: number;
  humidity_pct: number;
  comfort_band: {
    min_temp: number;
    max_temp: number;
    max_co2: number;
    min_humidity?: number;
    max_humidity?: number;
  };
  power_kw: number;
  hvac_electrical_kw: number;
  lighting_electrical_kw: number;
  equipment_electrical_kw: number;
  cooling_thermal_kw: number;
  baseline_expected_kw: number;
  variance_delta_kw: number;
  hvac_mode: string;
  fan_speed: string;
  lighting_level_pct: number;
  has_anomaly: boolean;
  anomaly_description: string;
  evidence: EvidenceType;
}

/**
 * Fetch overview of all 8 building zones: GET /zones
 */
export async function getZones(): Promise<ZoneSummaryResponse[]> {
  return apiFetch<ZoneSummaryResponse[]>("/zones");
}

/**
 * Fetch detailed state for an individual zone: GET /zones/{zone_id}/state
 */
export async function getZoneDetail(zoneId: string): Promise<ZoneDetailResponse> {
  return apiFetch<ZoneDetailResponse>(`/zones/${zoneId}/state`);
}

/**
 * Maps backend ZoneDetailResponse into frontend ZoneData representation.
 */
export function mapZoneDetailToZoneData(d: ZoneDetailResponse): ZoneData {
  return {
    id: d.id,
    name: d.name,
    code: d.code,
    floor: d.floor,
    areaSqM: d.area_sqm,
    maxCapacity: d.max_capacity,
    currentOccupancy: d.occupancy,
    predictedOccupancyNextHour: d.predicted_occupancy_next_hour,
    occupancyTrend: d.occupancy_trend,
    temperature: d.temperature_c,
    targetSetpoint: d.target_setpoint_c,
    humidity: d.humidity_pct,
    co2: d.co2_ppm,
    comfortBand: {
      minTemp: d.comfort_band.min_temp,
      maxTemp: d.comfort_band.max_temp,
      maxCo2: d.comfort_band.max_co2,
    },
    hvacPowerKw: d.hvac_electrical_kw,
    hvacMode: (d.hvac_mode as HVACMode) || "COOLING",
    hvacFanSpeed: (d.fan_speed as "LOW" | "MED" | "HIGH" | "AUTO") || "AUTO",
    lightingPowerKw: d.lighting_electrical_kw,
    lightingLevelPercent: d.lighting_level_pct,
    totalZonePowerKw: d.power_kw,
    baselineExpectedKw: d.baseline_expected_kw,
    isManualOverride: false,
    hasActiveAnomaly: d.has_anomaly,
    anomalyDescription: d.anomaly_description || undefined,
    evidence: d.evidence || "SIMULATED",
  };
}

/**
 * Fetches all zones with detailed telemetry by querying GET /zones and /zones/{zone_id}/state
 */
export async function getAllZonesDetailed(): Promise<ZoneData[]> {
  const summaries = await getZones();
  const details = await Promise.all(
    summaries.map(async (s) => {
      try {
        const detail = await getZoneDetail(s.id || s.zone_id);
        return mapZoneDetailToZoneData(detail);
      } catch {
        // Fallback to summary mapping if detail fails
        return {
          id: s.id || s.zone_id.toLowerCase().replace("-", ""),
          name: s.name,
          code: s.code || s.zone_id,
          floor: s.floor || 4,
          areaSqM: 100,
          maxCapacity: 20,
          currentOccupancy: s.occupancy,
          predictedOccupancyNextHour: s.occupancy,
          occupancyTrend: "STABLE" as const,
          temperature: s.temperature_c,
          targetSetpoint: s.target_setpoint_c || 22.0,
          humidity: s.humidity_pct || 50,
          co2: s.co2_ppm,
          comfortBand: { minTemp: 21.0, maxTemp: 25.0, maxCo2: 950 },
          hvacPowerKw: Math.max(0.5, s.power_kw * 0.7),
          hvacMode: (s.hvac_mode as HVACMode) || "COOLING",
          hvacFanSpeed: (s.fan_speed as any) || "AUTO",
          lightingPowerKw: Math.max(0.2, s.power_kw * 0.2),
          lightingLevelPercent: s.lighting_pct || 80,
          totalZonePowerKw: s.power_kw,
          baselineExpectedKw: s.power_kw,
          isManualOverride: false,
          hasActiveAnomaly: s.has_anomaly || false,
          anomalyDescription: s.anomaly_description || undefined,
          evidence: s.evidence || "SIMULATED",
        };
      }
    })
  );
  return details;
}
