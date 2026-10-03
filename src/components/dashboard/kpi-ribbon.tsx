"use client";

import React from "react";
import { useNexora } from "@/hooks/use-nexora";
import { Zap, Users, ShieldCheck, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiRibbon() {
  const { kpis } = useNexora();

  const isAnomalous = kpis.varianceDeltaKw > 1.5;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full">
      {/* 1. Gross Active Power vs Baseline */}
      <div className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#6B6864] dark:text-[#A4A09B] mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <Zap className="size-3.5 text-[#C05621]" />
            <span>Active Power</span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#2A2A28] border border-[#E0DBD4] dark:border-[#333330]">
            SIMULATED
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-[#141413] dark:text-[#F4F1EE]">
            {kpis.grossActivePowerKw}
          </span>
          <span className="text-xs font-semibold text-[#6B6864] dark:text-[#A4A09B]">kW</span>
        </div>
        <div className="mt-2.5 pt-2 border-t border-[#F4F1EE] dark:border-[#2A2A28] flex items-center justify-between text-xs">
          <span className="text-[#6B6864] dark:text-[#A4A09B]">Baseline: {kpis.baselineExpectedKw} kW</span>
          <span
            className={cn(
              "font-semibold flex items-center gap-0.5",
              isAnomalous ? "text-[#C05621]" : "text-[#15803D]"
            )}
          >
            {isAnomalous ? `+${kpis.varianceDeltaKw} kW (+${kpis.variancePercent}%)` : "Within band"}
          </span>
        </div>
      </div>

      {/* 2. Peak Demand vs Threshold */}
      <div className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#6B6864] dark:text-[#A4A09B] mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="size-3.5 text-[#C05621]" />
            <span>Peak Demand</span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#2A2A28] border border-[#E0DBD4] dark:border-[#333330]">
            SIMULATED
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-[#141413] dark:text-[#F4F1EE]">
            {kpis.peakDemandTodayKw}
          </span>
          <span className="text-xs font-semibold text-[#6B6864] dark:text-[#A4A09B]">kW (Max)</span>
        </div>
        <div className="mt-2.5 pt-2 border-t border-[#F4F1EE] dark:border-[#2A2A28] flex items-center justify-between text-xs">
          <span className="text-[#6B6864] dark:text-[#A4A09B]">Contract Limit: {kpis.peakThresholdKw} kW</span>
          <span className="text-[#15803D] font-semibold">91.8% of cap</span>
        </div>
      </div>

      {/* 3. Building Occupancy */}
      <div className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#6B6864] dark:text-[#A4A09B] mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <Users className="size-3.5 text-[#1E3A8A]" />
            <span>Total Occupancy</span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#2A2A28] border border-[#E0DBD4] dark:border-[#333330]">
            PIR &amp; BLE
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-[#141413] dark:text-[#F4F1EE]">
            {kpis.currentOccupancy}
          </span>
          <span className="text-xs font-semibold text-[#6B6864] dark:text-[#A4A09B]">
            / {kpis.maxBuildingCapacity} people
          </span>
        </div>
        <div className="mt-2.5 pt-2 border-t border-[#F4F1EE] dark:border-[#2A2A28] flex items-center justify-between text-xs">
          <span className="text-[#6B6864] dark:text-[#A4A09B]">Density: 56.7%</span>
          <span className="text-[#141413] dark:text-[#F4F1EE] font-medium">8.1 m² / person</span>
        </div>
      </div>

      {/* 4. Comfort & IAQ Compliance */}
      <div className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#6B6864] dark:text-[#A4A09B] mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="size-3.5 text-[#15803D]" />
            <span>Comfort &amp; IAQ</span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#2A2A28] border border-[#E0DBD4] dark:border-[#333330]">
            SENSORS
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-[#15803D]">
            {kpis.comfortCompliancePercent}%
          </span>
          <span className="text-xs font-semibold text-[#6B6864] dark:text-[#A4A09B]">Compliant</span>
        </div>
        <div className="mt-2.5 pt-2 border-t border-[#F4F1EE] dark:border-[#2A2A28] flex items-center justify-between text-xs">
          <span className="text-[#6B6864] dark:text-[#A4A09B]">IAQ / CO₂ Score</span>
          <span className="text-[#15803D] font-semibold">{kpis.iaqCompliancePercent}% &lt; 900 ppm</span>
        </div>
      </div>

      {/* 5. Verified Avoided Energy Today */}
      <div className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#6B6864] dark:text-[#A4A09B] mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <TrendingDown className="size-3.5 text-[#15803D]" />
            <span>Avoided Energy</span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20">
            VERIFIED M&amp;V
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-[#141413] dark:text-[#F4F1EE]">
            {kpis.totalEnergySavedTodayKwh}
          </span>
          <span className="text-xs font-semibold text-[#6B6864] dark:text-[#A4A09B]">kWh today</span>
        </div>
        <div className="mt-2.5 pt-2 border-t border-[#F4F1EE] dark:border-[#2A2A28] flex items-center justify-between text-xs">
          <span className="text-[#6B6864] dark:text-[#A4A09B]">Tariff: ₹{kpis.gridTariffInrPerKwh}/kWh</span>
          <span className="text-[#15803D] font-bold">₹{kpis.totalCostSavedTodayInr} saved</span>
        </div>
      </div>
    </div>
  );
}
