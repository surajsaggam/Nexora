/**
 * NEXORA Domain Types
 * Retrofit-first Building Intelligence Platform
 */

export type OperatingMode = "MONITOR" | "RECOMMEND" | "APPROVE" | "AUTOMATE";

export type EvidenceType = "MEASURED" | "SIMULATED" | "ASSUMED";

export type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH";

export type RecommendationStatus = 
  | "PENDING_APPROVAL" 
  | "APPROVED" 
  | "EXECUTING" 
  | "VERIFIED" 
  | "REJECTED" 
  | "AUTOMATED";

export type HVACMode = "COOLING" | "VENTILATION" | "STANDBY" | "SETBACK" | "OFF";

export interface ZoneData {
  id: string;
  name: string;
  code: string;
  floor: number;
  areaSqM: number;
  maxCapacity: number;
  currentOccupancy: number;
  predictedOccupancyNextHour: number;
  occupancyTrend: "RISING" | "STABLE" | "FALLING" | "VACANT";
  
  // Climate telemetry
  temperature: number; // °C
  targetSetpoint: number; // °C
  humidity: number; // %
  co2: number; // ppm
  comfortBand: {
    minTemp: number;
    maxTemp: number;
    maxCo2: number;
  };
  
  // Power & Equipment
  hvacPowerKw: number;
  hvacMode: HVACMode;
  hvacFanSpeed: "LOW" | "MED" | "HIGH" | "AUTO";
  lightingPowerKw: number;
  lightingLevelPercent: number;
  totalZonePowerKw: number;
  baselineExpectedKw: number;
  
  // Status flags
  isManualOverride: boolean;
  hasActiveAnomaly: boolean;
  anomalyDescription?: string;
  evidence: EvidenceType;
}

export interface SafetyCheckResult {
  category: "COMFORT" | "IAQ" | "EQUIPMENT" | "OPERATING_RULE" | "MODEL_CONFIDENCE";
  name: string;
  passed: boolean;
  value: string;
  threshold: string;
  detail: string;
}

export interface Recommendation {
  id: string;
  zoneId: string;
  zoneName: string;
  timestamp: string;
  title: string;
  signalDetected: string;
  reasoning: string;
  proposedAction: string;
  
  // Quantitative predictions
  predictedSavingsKwh: number;
  predictedCostSavingsInr: number;
  predictedPeakKwReduction: number;
  confidenceScore: number; // 0 - 100%
  
  // Safety Gating
  safetyGatePassed: boolean;
  safetyChecks: SafetyCheckResult[];
  
  status: RecommendationStatus;
  evidence: EvidenceType;
  requiresHumanApproval: boolean;
}

export interface VerificationRecord {
  id: string;
  recommendationId: string;
  zoneName: string;
  executedAt: string;
  verifiedAt: string;
  
  // 4-stage telemetry verification
  beforePowerKw: number;
  targetPowerKw: number;
  actualPowerKw: number;
  measuredReductionKw: number;
  
  tempBefore: number;
  tempAfter: number;
  co2Before: number;
  co2After: number;
  
  comfortPreserved: boolean;
  iaqPreserved: boolean;
  energySavedKwh: number;
  costSavedInr: number;
  status: "VERIFIED" | "DEVIATION_DETECTED";
  evidence: EvidenceType;
}

export interface BuildingKPIs {
  buildingName: string;
  totalAreaSqM: number;
  grossActivePowerKw: number;
  baselineExpectedKw: number;
  varianceDeltaKw: number;
  variancePercent: number;
  peakDemandTodayKw: number;
  peakThresholdKw: number;
  currentOccupancy: number;
  maxBuildingCapacity: number;
  comfortCompliancePercent: number;
  iaqCompliancePercent: number;
  totalEnergySavedTodayKwh: number;
  totalCostSavedTodayInr: number;
  activeAnomaliesCount: number;
  pendingApprovalsCount: number;
  gridStatus: "NORMAL" | "PEAK_ALERT" | "DEMAND_RESPONSE";
  gridTariffInrPerKwh: number;
}

export interface EnergyDataPoint {
  time: string;
  actualKw: number;
  baselineKw: number;
  coolingKw: number;
  lightingKw: number;
  isPeakPeriod: boolean;
  isInterventionApplied: boolean;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  outdoorTemp: number; // °C
  gridStress: "LOW" | "MODERATE" | "CRITICAL";
  expectedOccupancyFactor: number;
}
