"use client";

import { useEffect, useState } from "react";
import { nexoraEngine } from "@/lib/simulation-engine";
import { OperatingMode } from "@/types/nexora";

export function useNexora() {
  const [, setTick] = useState(0);

  useEffect(() => {
    // Initialize backend connection and state synchronization
    nexoraEngine.init();

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
    isBackendAvailable: nexoraEngine.isBackendConnected(),
    isLoading: nexoraEngine.getLoading(),
    error: nexoraEngine.getError(),
    peakEvent: nexoraEngine.getPeakEvent(),
    setOperatingMode: (mode: OperatingMode) => nexoraEngine.setOperatingMode(mode),
    setScenario: (scenarioId: string) => nexoraEngine.setScenario(scenarioId),
    approveRecommendation: (id: string) => nexoraEngine.approveRecommendation(id),
    rejectRecommendation: (id: string, reason?: string) => nexoraEngine.rejectRecommendation(id, reason),
    applyManualOverride: (
      zoneId: string,
      setpoint: number,
      lighting: number,
      mode: "COOLING" | "STANDBY" | "SETBACK" | "OFF"
    ) => nexoraEngine.applyManualOverride(zoneId, setpoint, lighting, mode),
    releaseManualOverride: (zoneId: string) => nexoraEngine.releaseManualOverride(zoneId),
    triggerPeakEvent: (targetLimitKw?: number, durationMinutes?: number) =>
      nexoraEngine.triggerPeakEvent(targetLimitKw, durationMinutes),
    stopPeakEvent: () => nexoraEngine.stopPeakEvent(),
    resetState: () => nexoraEngine.resetState(),
    refresh: () => nexoraEngine.refreshState(),
  };
}
