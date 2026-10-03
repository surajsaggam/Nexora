"use client";

import React from "react";
import { useNexora } from "@/hooks/use-nexora";
import { OperatingMode } from "@/types/nexora";
import { Building2, Sliders, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header({
  onOpenScenarioModal,
  onOpenZones,
}: {
  onOpenScenarioModal: () => void;
  onOpenZones?: () => void;
}) {
  const { mode, setOperatingMode, activeScenario, currentTime, resetState } = useNexora();

  const modes: { id: OperatingMode; label: string; desc: string }[] = [
    { id: "MONITOR", label: "Monitor", desc: "Telemetry only" },
    { id: "RECOMMEND", label: "Recommend", desc: "AI advisory" },
    { id: "APPROVE", label: "Approve", desc: "Human-in-the-loop" },
    { id: "AUTOMATE", label: "Automate", desc: "Gated auto-dispatch" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full pt-3 pb-2 px-4 sm:px-6 lg:px-8 bg-[#F4F1EE]/80 dark:bg-[#141413]/80 backdrop-blur-md transition-colors">
      <div className="mx-auto max-w-7xl bg-white/90 dark:bg-[#1D1D1B]/95 backdrop-blur-md border border-[#E0DBD4] dark:border-[#333330] rounded-full px-5 py-3 shadow-[0_4px_24px_-4px_rgba(20,20,19,0.06)] flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand & Facility Location */}
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-full bg-[#141413] text-[#F4F1EE] flex items-center justify-center font-bold text-base tracking-tighter shadow-sm">
            NX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-lg text-[#141413] dark:text-[#F4F1EE]">
                NEXORA
              </span>
              <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#EAE6E1] dark:bg-[#2A2A28] text-[#6B6864] dark:text-[#A4A09B]">
                Building Intelligence
              </span>
            </div>
            <button
              onClick={onOpenZones}
              className="flex items-center gap-1.5 text-xs text-[#6B6864] dark:text-[#A4A09B] hover:text-[#141413] dark:hover:text-[#F4F1EE] transition-colors text-left"
              title="Click to inspect all 8 zones"
            >
              <Building2 className="size-3" />
              <span>Apex Horizon Complex • Floor 4 (1,000 m²)</span>
              <span className="text-[#C05621] font-medium">• {currentTime} IST</span>
            </button>
          </div>
        </div>

        {/* Center: Human-In-The-Loop Control Pill */}
        <div className="flex items-center bg-[#F4F1EE] dark:bg-[#2A2A28] p-1 rounded-full border border-[#E0DBD4] dark:border-[#333330]">
          {modes.map((m) => {
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setOperatingMode(m.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 btn-press",
                  isActive
                    ? "bg-[#141413] text-[#F4F1EE] shadow-sm font-semibold"
                    : "text-[#6B6864] hover:text-[#141413] dark:hover:text-[#F4F1EE]"
                )}
                title={m.desc}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Right: Simulation Controls & Status */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenScenarioModal}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] hover:bg-[#EAE6E1] dark:hover:bg-[#2A2A28] transition-colors btn-press text-[#141413] dark:text-[#F4F1EE]"
            title="Switch Digital-Twin Simulation Scenario"
          >
            <Sliders className="size-3.5 text-[#C05621]" />
            <span className="max-w-[140px] truncate">{activeScenario.name}</span>
          </button>

          <button
            onClick={resetState}
            className="p-2 rounded-full border border-[#E0DBD4] dark:border-[#333330] hover:bg-[#EAE6E1] dark:hover:bg-[#2A2A28] text-[#6B6864] transition-colors btn-press"
            title="Reset Simulation State to Baseline"
          >
            <RotateCcw className="size-3.5" />
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#15803D]/10 text-[#15803D] text-[11px] font-semibold tracking-wide">
            <span className="size-2 rounded-full bg-[#15803D] animate-pulse" />
            <span>SENSING ACTIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
}
