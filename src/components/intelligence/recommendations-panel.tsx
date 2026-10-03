"use client";

import React, { useState } from "react";
import { useNexora } from "@/hooks/use-nexora";
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function RecommendationsPanel() {
  const { recommendations, approveRecommendation, rejectRecommendation, mode } = useNexora();
  const [expandedRecs, setExpandedRecs] = useState<Record<string, boolean>>({
    "rec-z04-01": true, // open primary demo recommendation by default
  });

  const toggleExpand = (id: string) => {
    setExpandedRecs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-5 shadow-sm w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#C05621]" />
            <h3 className="font-semibold text-base tracking-tight text-[#141413] dark:text-[#F4F1EE]">
              AI Decision Engine &amp; Safety Constraint Gating
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#C05621]/10 text-[#C05621] border border-[#C05621]/20 font-bold">
              {recommendations.length} Active Candidates
            </span>
          </div>
          <p className="text-xs text-[#6B6864] dark:text-[#A4A09B] mt-0.5">
            Every candidate control action must pass 5 formal safety &amp; comfort constraints before approval or automated dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] font-mono">
            Policy: {mode === "AUTOMATE" ? "Pre-Authorized Auto-Dispatch" : "Facility Manager Approval Required"}
          </span>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((rec) => {
          const isExpanded = expandedRecs[rec.id];
          const isPending = rec.status === "PENDING_APPROVAL";
          const isVerified = rec.status === "VERIFIED";

          return (
            <div
              key={rec.id}
              className={cn(
                "rounded-xl border p-4.5 transition-all duration-200",
                isPending
                  ? "bg-[#FAF8F5] dark:bg-[#242422] border-[#E0DBD4] dark:border-[#333330]"
                  : isVerified
                  ? "bg-[#15803D]/[0.03] border-[#15803D]/30"
                  : "bg-white dark:bg-[#1D1D1B] border-[#E0DBD4] dark:border-[#333330] opacity-80"
              )}
            >
              {/* Top Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-[#E0DBD4]/60 dark:border-[#333330]/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#141413] dark:text-[#F4F1EE]">{rec.zoneName}</span>
                  <span className="text-[#6B6864] dark:text-[#A4A09B] font-mono text-[11px]">
                    • Detected {rec.timestamp} IST
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded-full bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] text-[#6B6864] dark:text-[#A4A09B]">
                    EVIDENCE: {rec.evidence}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                      isPending
                        ? "bg-[#C05621] text-white"
                        : isVerified
                        ? "bg-[#15803D] text-white"
                        : "bg-[#6B6864] text-white"
                    )}
                  >
                    {rec.status.replace("_", " ")}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#141413] dark:text-[#F4F1EE]">
                    Confidence {rec.confidenceScore}%
                  </span>
                </div>
              </div>

              {/* Title & Core Pitch */}
              <h4 className="font-bold text-sm text-[#141413] dark:text-[#F4F1EE] mb-2 tracking-tight">
                {rec.title}
              </h4>

              {/* 3-Part Explanatory Grid: Signal -> Reasoning -> Action */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs mb-3.5">
                <div className="bg-white dark:bg-[#1D1D1B] p-2.5 rounded-xl border border-[#E0DBD4]/80 dark:border-[#333330]/80">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-[#6B6864] dark:text-[#A4A09B] mb-1">
                    <Radio className="size-3 text-[#C05621]" />
                    <span>1. Signal Detected</span>
                  </div>
                  <p className="text-[#141413] dark:text-[#F4F1EE] leading-snug">
                    {rec.signalDetected}
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1D1D1B] p-2.5 rounded-xl border border-[#E0DBD4]/80 dark:border-[#333330]/80">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-[#6B6864] dark:text-[#A4A09B] mb-1">
                    <Cpu className="size-3 text-[#1E3A8A]" />
                    <span>2. Predictive Reasoning</span>
                  </div>
                  <p className="text-[#141413] dark:text-[#F4F1EE] leading-snug">
                    {rec.reasoning}
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1D1D1B] p-2.5 rounded-xl border border-[#E0DBD4]/80 dark:border-[#333330]/80">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-[#6B6864] dark:text-[#A4A09B] mb-1">
                    <Zap className="size-3 text-[#15803D]" />
                    <span>3. Proposed Action</span>
                  </div>
                  <p className="text-[#141413] dark:text-[#F4F1EE] leading-snug font-medium">
                    {rec.proposedAction}
                  </p>
                </div>
              </div>

              {/* Quantified Predicted Impact Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4]/80 dark:border-[#333330]/80 mb-3 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#6B6864] dark:text-[#A4A09B] block">
                      Energy Saved
                    </span>
                    <span className="font-bold text-sm text-[#141413] dark:text-[#F4F1EE]">
                      {rec.predictedSavingsKwh} kWh/h
                    </span>
                  </div>
                  <div className="h-6 w-px bg-[#E0DBD4] dark:bg-[#333330]" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#6B6864] dark:text-[#A4A09B] block">
                      Cost Reduction
                    </span>
                    <span className="font-bold text-sm text-[#15803D]">
                      ₹{rec.predictedCostSavingsInr} / cycle
                    </span>
                  </div>
                  <div className="h-6 w-px bg-[#E0DBD4] dark:bg-[#333330]" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#6B6864] dark:text-[#A4A09B] block">
                      Peak Shift
                    </span>
                    <span className="font-bold text-sm text-[#C05621]">
                      -{rec.predictedPeakKwReduction} kW
                    </span>
                  </div>
                </div>

                {/* Safety Gate Trigger Accordion */}
                <button
                  onClick={() => toggleExpand(rec.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#141413] dark:text-[#F4F1EE] hover:text-[#C05621] transition-colors btn-press"
                >
                  <ShieldCheck className="size-3.5 text-[#15803D]" />
                  <span>Safety Gate: 5/5 PASSED</span>
                  {isExpanded ? (
                    <ChevronUp className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </button>
              </div>

              {/* Safety Gate Accordion Content */}
              {isExpanded && (
                <div className="mb-3.5 pt-2 border-t border-[#E0DBD4]/60 dark:border-[#333330]/60 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B6864] dark:text-[#A4A09B] flex items-center justify-between">
                    <span>Multi-Constraint Evaluation Gating</span>
                    <span className="text-[10px] font-mono text-[#15803D]">Status: CLEAR TO DISPATCH</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {rec.safetyChecks.map((check, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-[#1D1D1B] p-2 rounded-lg border border-[#E0DBD4]/60 dark:border-[#333330]/60 text-xs flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[11px] text-[#141413] dark:text-[#F4F1EE]">
                            {check.name}
                          </span>
                          <span className="flex items-center gap-0.5 text-[#15803D] text-[10px] font-bold">
                            <CheckCircle2 className="size-3" /> PASS
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between text-[11px] text-[#6B6864] dark:text-[#A4A09B]">
                          <span>Val: {check.value}</span>
                          <span className="font-mono text-[10px]">{check.threshold}</span>
                        </div>
                        <p className="text-[10px] text-[#6B6864] dark:text-[#A4A09B] mt-1 pt-1 border-t border-[#F4F1EE] dark:border-[#2A2A28]">
                          {check.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-[#6B6864] dark:text-[#A4A09B]">
                  {isPending && "Awaiting facility manager confirmation before BACnet setpoint command is dispatched."}
                  {isVerified && "Control command dispatched and impact verified by continuous telemetry read-back."}
                </div>

                {isPending && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => rejectRecommendation(rec.id)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[#E0DBD4] dark:border-[#333330] hover:bg-[#EAE6E1] dark:hover:bg-[#2A2A28] text-[#6B6864] transition-colors btn-press"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => approveRecommendation(rec.id)}
                      className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] hover:opacity-90 transition-all shadow-sm btn-press flex items-center gap-1.5"
                    >
                      <Zap className="size-3 text-[#C05621]" />
                      <span>Approve &amp; Execute</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
