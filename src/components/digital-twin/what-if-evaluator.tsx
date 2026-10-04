"use client";

import React from "react";
import { SCENARIOS } from "@/lib/simulation-engine";
import { useNexora } from "@/hooks/use-nexora";
import { X, Sliders, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatIfEvaluatorModal({ isOpen, onClose }: Props) {
  const { activeScenario, setScenario, peakEvent, stopPeakEvent, isLoading } = useNexora();

  React.useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPeakActive = peakEvent?.status === "ACTIVE";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[85vh] my-auto overflow-hidden"
      >
        {/* Header — pinned */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E0DBD4] dark:border-[#333330] mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-[#141413] text-[#F4F1EE] flex items-center justify-center">
              <Sliders className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#141413] dark:text-[#F4F1EE]">
                Digital Twin: What-If Scenario Evaluator
              </h3>
              <p className="text-xs text-[#6B6864] dark:text-[#A4A09B]">
                Apex Horizon Complex • Physics-Based Predictive Simulation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EAE6E1] dark:hover:bg-[#2A2A28] text-[#6B6864] transition-colors btn-press cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 pr-1.5 -mr-1 space-y-3 overscroll-contain">
          {/* Live Peak Event Status Banner if Active */}
          {isPeakActive && peakEvent && (
            <div className="p-3.5 rounded-2xl bg-[#C05621]/10 border border-[#C05621]/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#C05621] animate-pulse" />
                  <span className="text-xs font-bold text-[#C05621] uppercase tracking-wide">
                    Simulated Peak Demand Event Active
                  </span>
                </div>
                <button
                  disabled={isLoading}
                  onClick={async () => {
                    await stopPeakEvent();
                  }}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#C05621] text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? "Stopping..." : "Stop Peak Event"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white/80 dark:bg-black/30 p-2 rounded-xl">
                  <div className="text-[10px] text-[#6B6864] dark:text-[#A4A09B]">Target Limit</div>
                  <div className="font-bold font-mono">{peakEvent.target_limit_kw.toFixed(1)} kW</div>
                </div>
                <div className="bg-white/80 dark:bg-black/30 p-2 rounded-xl">
                  <div className="text-[10px] text-[#6B6864] dark:text-[#A4A09B]">Avoided Peak</div>
                  <div className="font-bold font-mono text-[#15803D]">-{peakEvent.peak_reduction_kw.toFixed(1)} kW</div>
                </div>
                <div className="bg-white/80 dark:bg-black/30 p-2 rounded-xl">
                  <div className="text-[10px] text-[#6B6864] dark:text-[#A4A09B]">Comfort Check</div>
                  <div className="font-bold text-[#15803D]">{peakEvent.comfort_pass ? "PASSED" : "VIOLATION"}</div>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-[#6B6864] dark:text-[#A4A09B]">
            Select a simulated operating condition to evaluate how NEXORA&apos;s constrained decision engine responds to grid stress, extreme weather, and altered occupancy patterns.
          </p>

          {/* Scenarios Grid */}
          <div className="space-y-2.5">
            {SCENARIOS.map((sc) => {
              const isSelected = sc.id === activeScenario.id;

              return (
                <div
                  key={sc.id}
                  onClick={() => {
                    setScenario(sc.id);
                    onClose();
                  }}
                  className={cn(
                    "p-3 rounded-2xl border cursor-pointer transition-all duration-150 btn-press flex items-start justify-between gap-3",
                    isSelected
                      ? "bg-[#141413] text-[#F4F1EE] border-[#141413] shadow-md"
                      : "bg-[#FAF8F5] dark:bg-[#242422] border-[#E0DBD4] dark:border-[#333330] hover:border-[#141413] dark:hover:border-[#F4F1EE]"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm tracking-tight">{sc.name}</h4>
                      <span
                        className={cn(
                          "text-[10px] font-mono uppercase px-2 py-0.2 rounded-full font-bold",
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-white dark:bg-[#1D1D1B] text-[#6B6864] border border-[#E0DBD4] dark:border-[#333330]"
                        )}
                      >
                        {sc.outdoorTemp}°C Ambient
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-xs leading-snug",
                        isSelected ? "text-[#F4F1EE]/80" : "text-[#6B6864] dark:text-[#A4A09B]"
                      )}
                    >
                      {sc.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                        sc.gridStress === "CRITICAL"
                          ? "bg-[#C05621] text-white"
                          : "bg-[#15803D]/20 text-[#15803D]"
                      )}
                    >
                      Grid: {sc.gridStress}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#F4F1EE] mt-1">
                        <CheckCircle2 className="size-3.5" /> ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer — pinned */}
        <div className="flex items-center justify-between text-xs text-[#6B6864] dark:text-[#A4A09B] pt-3 mt-3 border-t border-[#E0DBD4] dark:border-[#333330] shrink-0">
          <span className="text-[11px] font-mono">
            Model: 8-Zone Thermal Network + Chiller COP Curve
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] hover:opacity-90 transition-all btn-press cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
