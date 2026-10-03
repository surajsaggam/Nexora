"use client";

import React from "react";
import { useNexora } from "@/hooks/use-nexora";
import { CheckCircle2 } from "lucide-react";

export function VerificationFlowCard() {
  const { verifications } = useNexora();

  return (
    <div className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-5 shadow-sm w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#15803D]" />
            <h3 className="font-semibold text-base tracking-tight text-[#141413] dark:text-[#F4F1EE]">
              Measurement &amp; Verification (M&amp;V) Closed Loop
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20 font-bold">
              {verifications.length} Verified Interventions
            </span>
          </div>
          <p className="text-xs text-[#6B6864] dark:text-[#A4A09B] mt-0.5">
            NEXORA never merely claims savings. Telemetry read-back strictly verifies that post-action load dropped while comfort and IAQ were fully preserved.
          </p>
        </div>

        <div className="font-mono text-xs text-[#6B6864] dark:text-[#A4A09B]">
          Protocol: IPMVP Option C Baseline Comparison
        </div>
      </div>

      {/* Verification Records Flow */}
      <div className="space-y-3.5">
        {verifications.map((item) => (
          <div
            key={item.id}
            className="bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] rounded-xl p-4 shadow-sm"
          >
            {/* Top row: Zone, time, evidence */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-[#E0DBD4]/60 dark:border-[#333330]/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#141413] dark:text-[#F4F1EE]">{item.zoneName}</span>
                <span className="text-[#6B6864] dark:text-[#A4A09B] font-mono text-[11px]">
                  • Executed {item.executedAt} → Verified {item.verifiedAt}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] text-[#6B6864] dark:text-[#A4A09B]">
                  EVIDENCE: {item.evidence}
                </span>
                <span className="flex items-center gap-1 text-[#15803D] text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#15803D]/10">
                  <CheckCircle2 className="size-3" /> VERIFIED IMPACT
                </span>
              </div>
            </div>

            {/* 4-Step Pipeline: BEFORE -> ACTION -> AFTER -> VERIFIED */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              {/* Step 1: BEFORE */}
              <div className="bg-white dark:bg-[#1D1D1B] p-2.5 rounded-xl border border-[#E0DBD4]/80 dark:border-[#333330]/80">
                <div className="text-[10px] uppercase font-bold text-[#6B6864] dark:text-[#A4A09B] mb-1">
                  1. Before Intervention
                </div>
                <div className="text-lg font-bold text-[#141413] dark:text-[#F4F1EE]">
                  {item.beforePowerKw} kW
                </div>
                <div className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] mt-0.5">
                  Temp: {item.tempBefore.toFixed(1)}°C • CO₂: {item.co2Before} ppm
                </div>
              </div>

              {/* Step 2: ACTION */}
              <div className="bg-white dark:bg-[#1D1D1B] p-2.5 rounded-xl border border-[#E0DBD4]/80 dark:border-[#333330]/80">
                <div className="text-[10px] uppercase font-bold text-[#6B6864] dark:text-[#A4A09B] mb-1">
                  2. Control Actuation
                </div>
                <div className="text-xs font-bold text-[#C05621] mt-1 leading-snug">
                  BACnet Setpoint Shift &amp; Trim
                </div>
                <div className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] mt-1">
                  Target Expected Load: {item.targetPowerKw} kW
                </div>
              </div>

              {/* Step 3: AFTER */}
              <div className="bg-white dark:bg-[#1D1D1B] p-2.5 rounded-xl border border-[#E0DBD4]/80 dark:border-[#333330]/80">
                <div className="text-[10px] uppercase font-bold text-[#6B6864] dark:text-[#A4A09B] mb-1">
                  3. After Read-Back
                </div>
                <div className="text-lg font-bold text-[#15803D]">
                  {item.actualPowerKw} kW
                </div>
                <div className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] mt-0.5">
                  Temp: {item.tempAfter.toFixed(1)}°C • CO₂: {item.co2After} ppm
                </div>
              </div>

              {/* Step 4: VERIFIED IMPACT */}
              <div className="bg-[#15803D]/10 dark:bg-[#15803D]/20 p-2.5 rounded-xl border border-[#15803D]/30 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#15803D] mb-1">
                    4. Verified Outcome
                  </div>
                  <div className="text-base font-bold text-[#15803D]">
                    -{item.measuredReductionKw} kW ({item.energySavedKwh} kWh)
                  </div>
                </div>
                <div className="text-[11px] font-bold text-[#141413] dark:text-[#F4F1EE] pt-1 border-t border-[#15803D]/20">
                  ₹{item.costSavedInr} saved • Comfort Preserved
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
