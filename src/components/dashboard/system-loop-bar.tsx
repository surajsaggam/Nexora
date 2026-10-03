"use client";

import React from "react";
import { useNexora } from "@/hooks/use-nexora";
import { ShieldAlert, Cpu, Radio, LineChart, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SystemLoopBar() {
  const { kpis, recommendations, verifications, mode } = useNexora();

  const stages = [
    {
      id: "SENSE",
      label: "Sense",
      sub: "8/8 Zones Telemetry",
      icon: Radio,
      active: true,
      badge: "100%",
    },
    {
      id: "UNDERSTAND",
      label: "Understand",
      sub: "Dynamic Baseline",
      icon: LineChart,
      active: true,
      badge: kpis.activeAnomaliesCount > 0 ? `${kpis.activeAnomaliesCount} Anomaly` : "Nominal",
      isAlert: kpis.activeAnomaliesCount > 0,
    },
    {
      id: "PREDICT",
      label: "Predict",
      sub: "70m Vacancy Horizon",
      icon: Cpu,
      active: true,
      badge: "XGBoost 94.6%",
    },
    {
      id: "DECIDE",
      label: "Decide",
      sub: "Constrained Opt.",
      icon: Zap,
      active: recommendations.length > 0,
      badge: `${recommendations.length} Recs`,
    },
    {
      id: "GATE",
      label: "Gate",
      sub: "Comfort & IAQ Check",
      icon: ShieldAlert,
      active: true,
      badge: "5/5 Checks Pass",
    },
    {
      id: "ACT",
      label: "Act",
      sub: `Mode: ${mode}`,
      icon: Zap,
      active: mode === "AUTOMATE" || recommendations.some((r) => r.status === "APPROVED"),
      badge: mode === "AUTOMATE" ? "Automated" : "FM Gated",
    },
    {
      id: "VERIFY",
      label: "Verify",
      sub: "Continuous M&V",
      icon: CheckCircle2,
      active: verifications.length > 0,
      badge: `${verifications.length} Verified`,
    },
  ];

  return (
    <div className="w-full">
      <div className="bg-[#FAF8F5] dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-4 shadow-[0_2px_12px_-2px_rgba(20,20,19,0.04)]">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#15803D]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B6864] dark:text-[#A4A09B]">
              NEXORA Closed Loop Intelligence Architecture
            </h2>
          </div>
          <span className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] font-mono">
            Sense → Understand → Predict → Decide → Gate → Act → Verify
          </span>
        </div>

        {/* 7-Stage Horizontal Pipeline */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                className={cn(
                  "relative rounded-xl p-3 border transition-all duration-200",
                  stage.isAlert
                    ? "bg-[#C05621]/10 border-[#C05621]/30 text-[#141413] dark:text-[#F4F1EE]"
                    : "bg-white dark:bg-[#242422] border-[#E0DBD4] dark:border-[#333330] text-[#141413] dark:text-[#F4F1EE]"
                )}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-[#6B6864] dark:text-[#A4A09B]">
                      0{idx + 1}
                    </span>
                    <span className="text-xs font-bold tracking-tight">
                      {stage.label}
                    </span>
                  </div>
                  <Icon className={cn("size-3.5", stage.isAlert ? "text-[#C05621]" : "text-[#6B6864]")} />
                </div>
                <div className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] leading-tight mb-2 truncate">
                  {stage.sub}
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium inline-block truncate max-w-full",
                      stage.isAlert
                        ? "bg-[#C05621] text-white"
                        : "bg-[#F4F1EE] dark:bg-[#2A2A28] text-[#141413] dark:text-[#F4F1EE]"
                    )}
                  >
                    {stage.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
