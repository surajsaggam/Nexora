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
  const { activeScenario, setScenario } = useNexora();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-6 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E0DBD4] dark:border-[#333330] mb-4">
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
            className="p-1.5 rounded-full hover:bg-[#EAE6E1] dark:hover:bg-[#2A2A28] text-[#6B6864] transition-colors btn-press"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-xs text-[#6B6864] dark:text-[#A4A09B] mb-4">
          Select a simulated operating condition to evaluate how NEXORA&apos;s constrained decision engine responds to grid stress, extreme weather, and altered occupancy patterns.
        </p>

        {/* Scenarios Grid */}
        <div className="space-y-2.5 mb-6">
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
                  "p-3.5 rounded-2xl border cursor-pointer transition-all duration-150 btn-press flex items-start justify-between gap-3",
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

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-[#6B6864] dark:text-[#A4A09B] pt-3 border-t border-[#E0DBD4] dark:border-[#333330]">
          <span className="text-[11px] font-mono">
            Model: 8-Zone Thermal Network + Chiller COP Curve
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] hover:opacity-90 transition-all btn-press"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
