/**
 * NEXORA Simulation & Physics Engine
 * Model for Apex Horizon Complex (Floor 4 - 1,000 m², 8 Zones)
 * Conforms to Smart_Buildings_Final_Solution_Context.md & AGENTS.md
 */

import {
  BuildingKPIs,
  EnergyDataPoint,
  OperatingMode,
  Recommendation,
  SimulationScenario,
  VerificationRecord,
  ZoneData,
} from "@/types/nexora";

export const SCENARIOS: SimulationScenario[] = [
  {
    id: "standard",
    name: "Standard Workday Baseline",
    description: "Typical weekday schedule with moderate cooling demand (32°C ambient) and normal meetings.",
    outdoorTemp: 32,
    gridStress: "LOW",
    expectedOccupancyFactor: 1.0,
  },
  {
    id: "summer_peak",
    name: "Extreme Summer Grid Peak (39°C)",
    description: "High thermal load with peak utility demand penalties. Extreme stress on chillers.",
    outdoorTemp: 39,
    gridStress: "CRITICAL",
    expectedOccupancyFactor: 1.1,
  },
  {
    id: "demand_response",
    name: "Active Grid Demand Response Event",
    description: "Utility dispatched 15 kW load-shedding signal. Automatic pre-cooling & flexible setback.",
    outdoorTemp: 35,
    gridStress: "CRITICAL",
    expectedOccupancyFactor: 0.9,
  },
  {
    id: "remote_friday",
    name: "Hybrid Remote Low-Load Workday",
    description: "Reduced 40% building occupancy. Deep setback opportunities in unoccupied open zones.",
    outdoorTemp: 30,
    gridStress: "LOW",
    expectedOccupancyFactor: 0.45,
  },
];

// Initial deterministic state for the 8 Zones of Apex Horizon Complex
const INITIAL_ZONES: ZoneData[] = [
  {
    id: "z01",
    name: "South Open Workspace",
    code: "Z01-SOW",
    floor: 4,
    areaSqM: 280,
    maxCapacity: 32,
    currentOccupancy: 22,
    predictedOccupancyNextHour: 24,
    occupancyTrend: "RISING",
    temperature: 22.8,
    targetSetpoint: 22.5,
    humidity: 52,
    co2: 680,
    comfortBand: { minTemp: 21.0, maxTemp: 25.0, maxCo2: 950 },
    hvacPowerKw: 8.6,
    hvacMode: "COOLING",
    hvacFanSpeed: "AUTO",
    lightingPowerKw: 1.8,
    lightingLevelPercent: 85,
    totalZonePowerKw: 10.4,
    baselineExpectedKw: 10.8,
    isManualOverride: false,
    hasActiveAnomaly: false,
    evidence: "SIMULATED",
  },
  {
    id: "z02",
    name: "North Engineering Lab",
    code: "Z02-NEL",
    floor: 4,
    areaSqM: 220,
    maxCapacity: 24,
    currentOccupancy: 18,
    predictedOccupancyNextHour: 19,
    occupancyTrend: "STABLE",
    temperature: 22.1,
    targetSetpoint: 22.0,
    humidity: 48,
    co2: 610,
    comfortBand: { minTemp: 20.5, maxTemp: 24.5, maxCo2: 900 },
    hvacPowerKw: 7.2,
    hvacMode: "COOLING",
    hvacFanSpeed: "MED",
    lightingPowerKw: 1.5,
    lightingLevelPercent: 90,
    totalZonePowerKw: 8.7,
    baselineExpectedKw: 8.9,
    isManualOverride: false,
    hasActiveAnomaly: false,
    evidence: "SIMULATED",
  },
  {
    id: "z03",
    name: "Executive Boardroom",
    code: "Z03-EBR",
    floor: 4,
    areaSqM: 85,
    maxCapacity: 16,
    currentOccupancy: 12,
    predictedOccupancyNextHour: 0,
    occupancyTrend: "FALLING",
    temperature: 22.4,
    targetSetpoint: 22.0,
    humidity: 50,
    co2: 740,
    comfortBand: { minTemp: 21.0, maxTemp: 25.0, maxCo2: 900 },
    hvacPowerKw: 3.8,
    hvacMode: "COOLING",
    hvacFanSpeed: "AUTO",
    lightingPowerKw: 0.7,
    lightingLevelPercent: 100,
    totalZonePowerKw: 4.5,
    baselineExpectedKw: 4.6,
    isManualOverride: false,
    hasActiveAnomaly: false,
    evidence: "SIMULATED",
  },
  {
    id: "z04",
    name: "Conference Suite B",
    code: "Z04-CSB",
    floor: 4,
    areaSqM: 75,
    maxCapacity: 12,
    currentOccupancy: 0, // Meeting ended early!
    predictedOccupancyNextHour: 0,
    occupancyTrend: "VACANT",
    temperature: 21.2, // Overcooled while empty!
    targetSetpoint: 21.0,
    humidity: 46,
    co2: 440,
    comfortBand: { minTemp: 21.5, maxTemp: 25.5, maxCo2: 950 },
    hvacPowerKw: 4.8, // Burning full power despite 0 occupancy
    hvacMode: "COOLING",
    hvacFanSpeed: "HIGH",
    lightingPowerKw: 0.8,
    lightingLevelPercent: 100,
    totalZonePowerKw: 5.6,
    baselineExpectedKw: 2.1, // Anomaly delta: +3.5 kW above baseline
    isManualOverride: false,
    hasActiveAnomaly: true,
    anomalyDescription: "Meeting vacated 42m early. High HVAC cooling & 100% lighting active with 0 occupants.",
    evidence: "SIMULATED",
  },
  {
    id: "z05",
    name: "Central Collaboration Atrium",
    code: "Z05-CCA",
    floor: 4,
    areaSqM: 140,
    maxCapacity: 20,
    currentOccupancy: 9,
    predictedOccupancyNextHour: 14,
    occupancyTrend: "RISING",
    temperature: 23.4,
    targetSetpoint: 23.5,
    humidity: 54,
    co2: 560,
    comfortBand: { minTemp: 21.5, maxTemp: 25.5, maxCo2: 1000 },
    hvacPowerKw: 4.5,
    hvacMode: "COOLING",
    hvacFanSpeed: "AUTO",
    lightingPowerKw: 1.1,
    lightingLevelPercent: 75,
    totalZonePowerKw: 5.6,
    baselineExpectedKw: 5.8,
    isManualOverride: false,
    hasActiveAnomaly: false,
    evidence: "SIMULATED",
  },
  {
    id: "z06",
    name: "Cafeteria & Breakout Lounge",
    code: "Z06-CBL",
    floor: 4,
    areaSqM: 110,
    maxCapacity: 25,
    currentOccupancy: 4,
    predictedOccupancyNextHour: 18, // Lunch rush coming
    occupancyTrend: "RISING",
    temperature: 23.8,
    targetSetpoint: 23.0,
    humidity: 56,
    co2: 520,
    comfortBand: { minTemp: 21.0, maxTemp: 25.5, maxCo2: 1000 },
    hvacPowerKw: 3.6,
    hvacMode: "COOLING",
    hvacFanSpeed: "AUTO",
    lightingPowerKw: 0.9,
    lightingLevelPercent: 70,
    totalZonePowerKw: 4.5,
    baselineExpectedKw: 4.8,
    isManualOverride: false,
    hasActiveAnomaly: false,
    evidence: "SIMULATED",
  },
  {
    id: "z07",
    name: "Server Room & UPS Hub",
    code: "Z07-SRU",
    floor: 4,
    areaSqM: 40,
    maxCapacity: 2,
    currentOccupancy: 0,
    predictedOccupancyNextHour: 0,
    occupancyTrend: "VACANT",
    temperature: 19.8,
    targetSetpoint: 19.5,
    humidity: 42,
    co2: 410,
    comfortBand: { minTemp: 18.0, maxTemp: 22.0, maxCo2: 800 },
    hvacPowerKw: 5.2, // Critical cooling 24/7
    hvacMode: "COOLING",
    hvacFanSpeed: "HIGH",
    lightingPowerKw: 0.1,
    lightingLevelPercent: 20,
    totalZonePowerKw: 5.3,
    baselineExpectedKw: 5.3,
    isManualOverride: false,
    hasActiveAnomaly: false,
    evidence: "SIMULATED",
  },
  {
    id: "z08",
    name: "East Facilities & Reception",
    code: "Z08-EFR",
    floor: 4,
    areaSqM: 50,
    maxCapacity: 6,
    currentOccupancy: 3,
    predictedOccupancyNextHour: 3,
    occupancyTrend: "STABLE",
    temperature: 23.1,
    targetSetpoint: 23.0,
    humidity: 50,
    co2: 500,
    comfortBand: { minTemp: 21.0, maxTemp: 25.0, maxCo2: 950 },
    hvacPowerKw: 1.8,
    hvacMode: "COOLING",
    hvacFanSpeed: "LOW",
    lightingPowerKw: 0.4,
    lightingLevelPercent: 80,
    totalZonePowerKw: 2.2,
    baselineExpectedKw: 2.3,
    isManualOverride: false,
    hasActiveAnomaly: false,
    evidence: "SIMULATED",
  },
];

const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rec-z04-01",
    zoneId: "z04",
    zoneName: "Conference Suite B",
    timestamp: "14:02:18",
    title: "Vacant Meeting Room HVAC Setback & Daylighting Modulation",
    signalDetected: "Optical PIR & BLE beacons report 0 occupants for 42 consecutive minutes. Calendar reservation released.",
    reasoning: "Isolation Forest flagged +3.5 kW unexpected consumption delta. XGBoost predicts 78 minutes of continued vacancy before next scheduled booking. Room is overcooled to 21.2°C.",
    proposedAction: "Modulate HVAC setpoint from 21.0°C to 24.5°C and reduce lighting ballasts to 15% standby trim.",
    predictedSavingsKwh: 3.4,
    predictedCostSavingsInr: 32.3, // at ₹9.50/kWh
    predictedPeakKwReduction: 3.5,
    confidenceScore: 94.6,
    safetyGatePassed: true,
    safetyChecks: [
      {
        category: "COMFORT",
        name: "Max Setback Boundary",
        passed: true,
        value: "24.5°C",
        threshold: "≤ 25.5°C max",
        detail: "Simulated thermal drift will stabilize at 23.4°C in 45m. Comfort preserved.",
      },
      {
        category: "IAQ",
        name: "Ventilation & CO₂ Safety",
        passed: true,
        value: "440 ppm",
        threshold: "≤ 950 ppm",
        detail: "Zone currently empty. Minimum damper opening guarantees IAQ compliance.",
      },
      {
        category: "EQUIPMENT",
        name: "Compressor Anti-Cycle Lockout",
        passed: true,
        value: "54m elapsed",
        threshold: "≥ 15m lockout",
        detail: "VAV damper actuation will not cause chiller short-cycling.",
      },
      {
        category: "OPERATING_RULE",
        name: "Building Priority & Criticality",
        passed: true,
        value: "Non-Critical Zone",
        threshold: "Tier 3 Office",
        detail: "Zone is marked flexible office space. Executive override is disabled.",
      },
      {
        category: "MODEL_CONFIDENCE",
        name: "Prediction Confidence Metric",
        passed: true,
        value: "94.6%",
        threshold: "≥ 85.0%",
        detail: "Calibrated on 90-day building occupancy and thermal decay history.",
      },
    ],
    status: "PENDING_APPROVAL",
    evidence: "SIMULATED",
    requiresHumanApproval: true,
  },
  {
    id: "rec-z03-02",
    zoneId: "z03",
    zoneName: "Executive Boardroom",
    timestamp: "14:15:00",
    title: "Pre-Cooling Ramp Prior to 15:00 Global All-Hands Meeting",
    signalDetected: "Room booking starts in 45 minutes with 14 attendees. Current temp 22.4°C.",
    reasoning: "Pre-cooling building thermal mass for 20 minutes now avoids 2.8 kW chiller demand spike during the impending 15:00 utility peak tariff window.",
    proposedAction: "Pulse cooling to 21.5°C at 14:25, then drift setpoint to 23.0°C during peak tariff.",
    predictedSavingsKwh: 2.1,
    predictedCostSavingsInr: 26.5,
    predictedPeakKwReduction: 2.8,
    confidenceScore: 91.2,
    safetyGatePassed: true,
    safetyChecks: [
      {
        category: "COMFORT",
        name: "Pre-Occupancy Thermal Comfort",
        passed: true,
        value: "22.0°C target",
        threshold: "21.0 - 24.0°C",
        detail: "Room will hit optimal 22.2°C at occupancy start.",
      },
      {
        category: "IAQ",
        name: "Pre-Flush IAQ Fresh Air Cycle",
        passed: true,
        value: "100% fresh air flush",
        threshold: "ASHRAE 62.1",
        detail: "Exhausts stagnant air before attendees arrive.",
      },
      {
        category: "EQUIPMENT",
        name: "AHU-4 Fan Ramp Rate",
        passed: true,
        value: "5 Hz/min ramp",
        threshold: "≤ 8 Hz/min",
        detail: "Within manufacturer VFD ramp-up tolerances.",
      },
      {
        category: "OPERATING_RULE",
        name: "Boardroom Protocol Gating",
        passed: true,
        value: "Gated",
        threshold: "FM Signoff",
        detail: "Executive room policy requires explicit Facility Manager approval.",
      },
      {
        category: "MODEL_CONFIDENCE",
        name: "Thermal Mass Absorption Model",
        passed: true,
        value: "91.2%",
        threshold: "≥ 85.0%",
        detail: "Validation against building thermal inertia log.",
      },
    ],
    status: "PENDING_APPROVAL",
    evidence: "SIMULATED",
    requiresHumanApproval: true,
  },
];

const INITIAL_VERIFICATIONS: VerificationRecord[] = [
  {
    id: "ver-001",
    recommendationId: "rec-z06-prior",
    zoneName: "Cafeteria & Breakout Lounge",
    executedAt: "12:45:00",
    verifiedAt: "13:45:00",
    beforePowerKw: 6.8,
    targetPowerKw: 4.5,
    actualPowerKw: 4.4,
    measuredReductionKw: 2.4,
    tempBefore: 22.0,
    tempAfter: 23.8,
    co2Before: 790,
    co2After: 520,
    comfortPreserved: true,
    iaqPreserved: true,
    energySavedKwh: 2.4,
    costSavedInr: 22.8,
    status: "VERIFIED",
    evidence: "SIMULATED",
  },
  {
    id: "ver-002",
    recommendationId: "rec-z01-morning",
    zoneName: "South Open Workspace",
    executedAt: "09:15:00",
    verifiedAt: "10:15:00",
    beforePowerKw: 12.2,
    targetPowerKw: 10.4,
    actualPowerKw: 10.3,
    measuredReductionKw: 1.9,
    tempBefore: 21.8,
    tempAfter: 22.8,
    co2Before: 510,
    co2After: 680,
    comfortPreserved: true,
    iaqPreserved: true,
    energySavedKwh: 1.9,
    costSavedInr: 18.05,
    status: "VERIFIED",
    evidence: "SIMULATED",
  },
];

// 24-Hour Telemetry curve for Apex Horizon Complex (kW over time)
export const TIMELINE_ENERGY_SERIES: EnergyDataPoint[] = [
  { time: "00:00", actualKw: 14.2, baselineKw: 14.5, coolingKw: 8.5, lightingKw: 1.2, isPeakPeriod: false, isInterventionApplied: false },
  { time: "02:00", actualKw: 13.8, baselineKw: 14.0, coolingKw: 8.2, lightingKw: 1.0, isPeakPeriod: false, isInterventionApplied: false },
  { time: "04:00", actualKw: 14.0, baselineKw: 14.1, coolingKw: 8.4, lightingKw: 1.0, isPeakPeriod: false, isInterventionApplied: false },
  { time: "06:00", actualKw: 18.5, baselineKw: 19.0, coolingKw: 11.2, lightingKw: 2.5, isPeakPeriod: false, isInterventionApplied: false },
  { time: "08:00", actualKw: 34.2, baselineKw: 36.5, coolingKw: 22.4, lightingKw: 5.6, isPeakPeriod: false, isInterventionApplied: true },
  { time: "09:00", actualKw: 42.8, baselineKw: 45.2, coolingKw: 28.6, lightingKw: 7.2, isPeakPeriod: false, isInterventionApplied: true },
  { time: "10:00", actualKw: 48.6, baselineKw: 51.0, coolingKw: 32.8, lightingKw: 8.0, isPeakPeriod: false, isInterventionApplied: true },
  { time: "11:00", actualKw: 52.4, baselineKw: 55.6, coolingKw: 35.4, lightingKw: 8.4, isPeakPeriod: true, isInterventionApplied: true },
  { time: "12:00", actualKw: 55.1, baselineKw: 58.2, coolingKw: 37.2, lightingKw: 8.6, isPeakPeriod: true, isInterventionApplied: true },
  { time: "13:00", actualKw: 51.8, baselineKw: 56.4, coolingKw: 34.8, lightingKw: 8.2, isPeakPeriod: true, isInterventionApplied: true },
  { time: "14:00", actualKw: 46.9, baselineKw: 50.4, coolingKw: 31.0, lightingKw: 8.1, isPeakPeriod: true, isInterventionApplied: false }, // current point
  { time: "15:00", actualKw: 43.5, baselineKw: 49.8, coolingKw: 28.5, lightingKw: 7.8, isPeakPeriod: true, isInterventionApplied: true }, // projected
  { time: "16:00", actualKw: 41.2, baselineKw: 47.5, coolingKw: 26.8, lightingKw: 7.4, isPeakPeriod: false, isInterventionApplied: true },
  { time: "17:00", actualKw: 38.0, baselineKw: 44.0, coolingKw: 24.2, lightingKw: 6.8, isPeakPeriod: false, isInterventionApplied: true },
  { time: "18:00", actualKw: 29.5, baselineKw: 34.2, coolingKw: 18.5, lightingKw: 4.8, isPeakPeriod: false, isInterventionApplied: true },
  { time: "19:00", actualKw: 22.0, baselineKw: 25.8, coolingKw: 14.0, lightingKw: 3.2, isPeakPeriod: false, isInterventionApplied: true },
  { time: "20:00", actualKw: 16.5, baselineKw: 18.0, coolingKw: 10.2, lightingKw: 1.8, isPeakPeriod: false, isInterventionApplied: false },
  { time: "22:00", actualKw: 14.8, baselineKw: 15.2, coolingKw: 8.9, lightingKw: 1.2, isPeakPeriod: false, isInterventionApplied: false },
];

/**
 * State container for NEXORA Building Intelligence
 */
class NexoraStore {
  private zones: ZoneData[] = JSON.parse(JSON.stringify(INITIAL_ZONES));
  private recommendations: Recommendation[] = JSON.parse(JSON.stringify(INITIAL_RECOMMENDATIONS));
  private verifications: VerificationRecord[] = JSON.parse(JSON.stringify(INITIAL_VERIFICATIONS));
  private mode: OperatingMode = "APPROVE";
  private activeScenario: SimulationScenario = SCENARIOS[0];
  private currentTime = "14:15";
  private isSimulationRunning = false;
  private listeners: Set<() => void> = new Set();

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // Getters
  public getZones(): ZoneData[] {
    return this.zones;
  }

  public getRecommendations(): Recommendation[] {
    return this.recommendations;
  }

  public getVerifications(): VerificationRecord[] {
    return this.verifications;
  }

  public getMode(): OperatingMode {
    return this.mode;
  }

  public getActiveScenario(): SimulationScenario {
    return this.activeScenario;
  }

  public getCurrentTime(): string {
    return this.currentTime;
  }

  public isRunning(): boolean {
    return this.isSimulationRunning;
  }

  // Building Aggregated KPIs calculation
  public getKPIs(): BuildingKPIs {
    const grossActivePowerKw = Number(
      this.zones.reduce((sum, z) => sum + z.totalZonePowerKw, 0).toFixed(1)
    );
    const baselineExpectedKw = Number(
      this.zones.reduce((sum, z) => sum + z.baselineExpectedKw, 0).toFixed(1)
    );
    const varianceDeltaKw = Number((grossActivePowerKw - baselineExpectedKw).toFixed(1));
    const variancePercent = Number(((varianceDeltaKw / baselineExpectedKw) * 100).toFixed(1));
    const currentOccupancy = this.zones.reduce((sum, z) => sum + z.currentOccupancy, 0);
    const maxBuildingCapacity = this.zones.reduce((sum, z) => sum + z.maxCapacity, 0);

    const compliantZones = this.zones.filter(
      (z) => z.temperature >= z.comfortBand.minTemp && z.temperature <= z.comfortBand.maxTemp
    ).length;
    const comfortCompliancePercent = Math.round((compliantZones / this.zones.length) * 100);

    const compliantIaqZones = this.zones.filter(
      (z) => z.co2 <= z.comfortBand.maxCo2
    ).length;
    const iaqCompliancePercent = Math.round((compliantIaqZones / this.zones.length) * 100);

    const totalEnergySavedTodayKwh = Number(
      this.verifications.reduce((sum, v) => sum + v.energySavedKwh, 0).toFixed(1)
    );
    const totalCostSavedTodayInr = Math.round(
      this.verifications.reduce((sum, v) => sum + v.costSavedInr, 0)
    );

    const activeAnomaliesCount = this.zones.filter((z) => z.hasActiveAnomaly).length;
    const pendingApprovalsCount = this.recommendations.filter(
      (r) => r.status === "PENDING_APPROVAL"
    ).length;

    return {
      buildingName: "Apex Horizon Commercial Complex — Floor 4",
      totalAreaSqM: 1000,
      grossActivePowerKw,
      baselineExpectedKw,
      varianceDeltaKw,
      variancePercent,
      peakDemandTodayKw: 55.1,
      peakThresholdKw: 60.0,
      currentOccupancy,
      maxBuildingCapacity,
      comfortCompliancePercent,
      iaqCompliancePercent,
      totalEnergySavedTodayKwh,
      totalCostSavedTodayInr,
      activeAnomaliesCount,
      pendingApprovalsCount,
      gridStatus: this.activeScenario.gridStress === "CRITICAL" ? "PEAK_ALERT" : "NORMAL",
      gridTariffInrPerKwh: 9.5,
    };
  }

  // Operating Mode Switcher
  public setOperatingMode(newMode: OperatingMode) {
    this.mode = newMode;
    if (newMode === "AUTOMATE") {
      // Automatically execute all pending recommendations whose safety gate passed
      this.executeAutomatedEligible();
    }
    this.notify();
  }

  // Scenario Switcher
  public setScenario(scenarioId: string) {
    const s = SCENARIOS.find((item) => item.id === scenarioId);
    if (!s) return;
    this.activeScenario = s;

    // Recalculate cooling loads based on ambient temperature delta
    const tempMultiplier = s.outdoorTemp / 32.0;
    this.zones = this.zones.map((z) => {
      const newHvacPower = Number((z.hvacPowerKw * (z.isManualOverride ? 1 : tempMultiplier)).toFixed(1));
      return {
        ...z,
        hvacPowerKw: newHvacPower,
        totalZonePowerKw: Number((newHvacPower + z.lightingPowerKw).toFixed(1)),
        baselineExpectedKw: Number((z.baselineExpectedKw * tempMultiplier).toFixed(1)),
        evidence: "SIMULATED",
      };
    });

    this.notify();
  }

  // Human-In-The-Loop Action Approval
  public approveRecommendation(recId: string): boolean {
    const rec = this.recommendations.find((r) => r.id === recId);
    if (!rec || rec.status !== "PENDING_APPROVAL") return false;

    rec.status = "APPROVED";
    this.notify();

    // Simulate immediate BACnet control actuation
    setTimeout(() => {
      this.executeAction(rec);
    }, 400);

    return true;
  }

  public rejectRecommendation(recId: string): boolean {
    const rec = this.recommendations.find((r) => r.id === recId);
    if (!rec) return false;
    rec.status = "REJECTED";
    this.notify();
    return true;
  }

  private executeAutomatedEligible() {
    const eligible = this.recommendations.filter(
      (r) => r.status === "PENDING_APPROVAL" && r.safetyGatePassed
    );
    eligible.forEach((r) => {
      r.status = "AUTOMATED";
      this.executeAction(r);
    });
  }

  private executeAction(rec: Recommendation) {
    const targetZone = this.zones.find((z) => z.id === rec.zoneId);
    if (!targetZone) return;

    const beforePower = targetZone.totalZonePowerKw;
    const tempBefore = targetZone.temperature;
    const co2Before = targetZone.co2;

    // Modify zone state according to action
    if (rec.zoneId === "z04") {
      targetZone.targetSetpoint = 24.5;
      targetZone.temperature = 22.6; // initial drift
      targetZone.hvacPowerKw = 1.6;
      targetZone.hvacFanSpeed = "LOW";
      targetZone.hvacMode = "SETBACK";
      targetZone.lightingPowerKw = 0.2;
      targetZone.lightingLevelPercent = 15;
      targetZone.totalZonePowerKw = 1.8;
      targetZone.hasActiveAnomaly = false;
      targetZone.anomalyDescription = undefined;
      targetZone.evidence = "SIMULATED";
    } else if (rec.zoneId === "z03") {
      targetZone.targetSetpoint = 21.5;
      targetZone.temperature = 21.8;
      targetZone.hvacPowerKw = 2.4;
      targetZone.totalZonePowerKw = 3.1;
      targetZone.evidence = "SIMULATED";
    }

    rec.status = "VERIFIED";

    // Create M&V Verification record in the closed loop
    const actualPower = targetZone.totalZonePowerKw;
    const measuredReduction = Number((beforePower - actualPower).toFixed(1));
    const savedKwh = Number((measuredReduction * 1.0).toFixed(1));
    const costSaved = Math.round(savedKwh * 9.5);

    const newVerification: VerificationRecord = {
      id: `ver-${Date.now().toString().slice(-4)}`,
      recommendationId: rec.id,
      zoneName: targetZone.name,
      executedAt: rec.timestamp,
      verifiedAt: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      beforePowerKw: beforePower,
      targetPowerKw: actualPower,
      actualPowerKw: actualPower,
      measuredReductionKw: measuredReduction,
      tempBefore,
      tempAfter: targetZone.temperature,
      co2Before,
      co2After: targetZone.co2,
      comfortPreserved: true,
      iaqPreserved: true,
      energySavedKwh: savedKwh,
      costSavedInr: costSaved,
      status: "VERIFIED",
      evidence: "SIMULATED",
    };

    this.verifications.unshift(newVerification);
    this.notify();
  }

  // Facility Manager Manual Override
  public applyManualOverride(
    zoneId: string,
    setpoint: number,
    lightingPercent: number,
    hvacMode: "COOLING" | "STANDBY" | "SETBACK" | "OFF"
  ) {
    const z = this.zones.find((zone) => zone.id === zoneId);
    if (!z) return;

    z.isManualOverride = true;
    z.targetSetpoint = setpoint;
    z.lightingLevelPercent = lightingPercent;
    z.hvacMode = hvacMode;

    // Recalculate immediate power based on setpoint
    // Lower setpoint = higher cooling power
    const delta = Math.max(0, 26 - setpoint);
    z.hvacPowerKw = Number((delta * (z.areaSqM / 65)).toFixed(1));
    z.lightingPowerKw = Number(((lightingPercent / 100) * (z.areaSqM / 150)).toFixed(1));
    z.totalZonePowerKw = Number((z.hvacPowerKw + z.lightingPowerKw).toFixed(1));
    z.evidence = "SIMULATED";

    this.notify();
  }

  public releaseManualOverride(zoneId: string) {
    const z = this.zones.find((zone) => zone.id === zoneId);
    if (!z) return;

    z.isManualOverride = false;
    // reset to baseline
    const original = INITIAL_ZONES.find((iz) => iz.id === zoneId);
    if (original) {
      z.targetSetpoint = original.targetSetpoint;
      z.lightingLevelPercent = original.lightingLevelPercent;
      z.hvacPowerKw = original.hvacPowerKw;
      z.lightingPowerKw = original.lightingPowerKw;
      z.totalZonePowerKw = original.totalZonePowerKw;
      z.hvacMode = original.hvacMode;
      z.evidence = original.evidence;
    }

    this.notify();
  }

  // Reset demo state
  public resetState() {
    this.zones = JSON.parse(JSON.stringify(INITIAL_ZONES));
    this.recommendations = JSON.parse(JSON.stringify(INITIAL_RECOMMENDATIONS));
    this.verifications = JSON.parse(JSON.stringify(INITIAL_VERIFICATIONS));
    this.mode = "APPROVE";
    this.activeScenario = SCENARIOS[0];
    this.currentTime = "14:15";
    this.notify();
  }
}

// Singleton simulation instance
export const nexoraEngine = new NexoraStore();
