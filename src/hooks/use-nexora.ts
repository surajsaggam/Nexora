"use client";

import { useEffect, useState } from "react";
import { nexoraEngine } from "@/lib/simulation-engine";
import { OperatingMode } from "@/types/nexora";

export function useNexora() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = nexoraEngine.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => unsubscribe();
  }, []);

  return {
    zones: nexoraEngine.getZones(),
    recommendations: nexoraEngine.getRecommendations(),
    verifications: nexoraEngine.getVerifications(),
    kpis: nexoraEngine.getKPIs(),
    mode: nexoraEngine.getMode(),
    activeScenario: nexoraEngine.getActiveScenario(),
    currentTime: nexoraEngine.getCurrentTime(),
    isRunning: nexoraEngine.isRunning(),
    setOperatingMode: (mode: OperatingMode) => nexoraEngine.setOperatingMode(mode),
    setScenario: (scenarioId: string) => nexoraEngine.setScenario(scenarioId),
    approveRecommendation: (id: string) => nexoraEngine.approveRecommendation(id),
    rejectRecommendation: (id: string) => nexoraEngine.rejectRecommendation(id),
    applyManualOverride: (
      zoneId: string,
      setpoint: number,
      lighting: number,
      mode: "COOLING" | "STANDBY" | "SETBACK" | "OFF"
    ) => nexoraEngine.applyManualOverride(zoneId, setpoint, lighting, mode),
    releaseManualOverride: (zoneId: string) => nexoraEngine.releaseManualOverride(zoneId),
    resetState: () => nexoraEngine.resetState(),
  };
}
