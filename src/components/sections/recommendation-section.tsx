"use client";

import React from "react";
import { useNexora } from "@/hooks/use-nexora";
import { Zap, CheckCircle2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function RecommendationSection() {
  const { recommendations, approveRecommendation, rejectRecommendation } = useNexora();

  // Primary demo recommendation: Conference Suite B
  const rec = recommendations.find((r) => r.id === "rec-z04-01") || recommendations[0];

  if (!rec) return null;

  const isPending = rec.status === "PENDING_APPROVAL";
  const isVerified = rec.status === "VERIFIED";

  return (
    <section id="recommendations" className="py-20 sm:py-28 border-t border-[#E0DBD4] dark:border-[#333330]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-10 sm:mb-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="size-2 rounded-full bg-[#C05621]" />
            <span className="text-xs uppercase font-bold tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
              Live Intelligence
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-[#141413] dark:text-[#F4F1EE] mb-3">
            A Live Recommendation: Conference Suite B
          </h2>
          <p className="text-base sm:text-lg text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
            The meeting ended early. The space is empty, but cooling is still blasting at full power. Here is what NEXORA recommends doing right now.
          </p>
        </div>

        {/* Focused Interactive Card */}
        <div
          className={cn(
            "bg-white dark:bg-[#1D1D1B] border rounded-3xl p-6 sm:p-10 shadow-sm transition-all duration-300",
            isPending
              ? "border-[#E0DBD4] dark:border-[#333330]"
              : isVerified
              ? "border-[#15803D] ring-2 ring-[#15803D]/20 bg-[#15803D]/[0.02]"
              : "border-[#E0DBD4] dark:border-[#333330]"
          )}
        >
          {/* Top Bar: Room + Status + Confidence */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#E0DBD4]/80 dark:border-[#333330]/80 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] text-[#141413] dark:text-[#F4F1EE]">
                {rec.zoneName} (Z04-CSB)
              </span>
              <span className="text-xs text-[#6B6864] dark:text-[#A4A09B] font-mono">
                Detected at {rec.timestamp} IST
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-[#141413] dark:text-[#F4F1EE]">
                Confidence: {rec.confidenceScore}%
              </span>
              <span
                className={cn(
                  "text-xs font-semibold px-3 py-1 rounded-full",
                  isPending
                    ? "bg-[#C05621] text-white"
                    : isVerified
                    ? "bg-[#15803D] text-white"
                    : "bg-[#6B6864] text-white"
                )}
              >
                {isPending
                  ? "Waiting for approval"
                  : isVerified
                  ? "Verified impact"
                  : rec.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Core Story Headline */}
          <div className="max-w-3xl mb-8">
            <div className="text-xs uppercase font-bold tracking-wider text-[#C05621] mb-2 font-mono">
              Why this action?
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141413] dark:text-[#F4F1EE] mb-3">
              {rec.title}
            </h3>
            <p className="text-base text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
              Sensors detect <strong className="text-[#141413] dark:text-[#F4F1EE]">0 occupants</strong>. The room will remain empty for the next <strong className="text-[#141413] dark:text-[#F4F1EE]">78 minutes</strong> before the next calendar reservation. NEXORA proposes raising the cooling setpoint to <strong className="text-[#141413] dark:text-[#F4F1EE]">24.5°C</strong> and dimming lights to 15%.
            </p>
          </div>

          {/* 3 Clear Impact Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#FAF8F5] dark:bg-[#242422] p-4 rounded-2xl border border-[#E0DBD4]/80 dark:border-[#333330]/80">
              <div className="text-xs font-semibold text-[#6B6864] dark:text-[#A4A09B] mb-1">
                Avoided Energy
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-[#F4F1EE]">
                {rec.predictedSavingsKwh} <span className="text-sm font-normal text-[#6B6864]">kWh/h</span>
              </div>
              <p className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] mt-1">
                Cooling load drops from 4.8 kW to 1.6 kW
              </p>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-[#242422] p-4 rounded-2xl border border-[#E0DBD4]/80 dark:border-[#333330]/80">
              <div className="text-xs font-semibold text-[#6B6864] dark:text-[#A4A09B] mb-1">
                Cost Saved per Cycle
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#15803D]">
                ₹{rec.predictedCostSavingsInr}
              </div>
              <p className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] mt-1">
                Calculated at daytime commercial tariff
              </p>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-[#242422] p-4 rounded-2xl border border-[#E0DBD4]/80 dark:border-[#333330]/80">
              <div className="text-xs font-semibold text-[#6B6864] dark:text-[#A4A09B] mb-1">
                Peak Demand Reduction
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#C05621]">
                -{rec.predictedPeakKwReduction} <span className="text-sm font-normal text-[#6B6864]">kW</span>
              </div>
              <p className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] mt-1">
                Relieves chiller load during peak hours
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E0DBD4]/80 dark:border-[#333330]/80">
            <div className="flex items-center gap-2 text-xs text-[#6B6864] dark:text-[#A4A09B]">
              <ShieldCheck className="size-4 text-[#15803D]" />
              <span>Safety check passed (5/5 checks) &bull; Safe to act</span>
            </div>

            {isPending && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => rejectRecommendation(rec.id)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold border border-[#E0DBD4] dark:border-[#333330] hover:bg-[#EAE6E1] dark:hover:bg-[#2A2A28] text-[#6B6864] transition-colors btn-press cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => approveRecommendation(rec.id)}
                  className="bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] px-6 py-2.5 rounded-full text-xs font-bold tracking-tight hover:opacity-90 transition-all btn-press shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="size-3.5 text-[#C05621]" />
                  <span>Approve &amp; Dispatch</span>
                </button>
              </div>
            )}

            {isVerified && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#15803D]">
                <CheckCircle2 className="size-4" />
                <span>Command Dispatched &bull; Verified impact: saved 3.8 kW</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
