"use client";

import React from "react";
import { Sliders, Eye, Sparkles, CheckCircle2, RotateCcw, ShieldCheck, Activity, Layers } from "lucide-react";
import { useNexora } from "@/hooks/use-nexora";
import { OperatingMode } from "@/types/nexora";
import { NexoraLogo } from "@/components/ui/nexora-logo";

interface ControlSummarySectionProps {
  onOpenOverride: () => void;
  onOpenZones: () => void;
  onOpenWhatIf: () => void;
}

export function ControlSummarySection({
  onOpenOverride,
  onOpenZones,
  onOpenWhatIf,
}: ControlSummarySectionProps) {
  const { mode, setOperatingMode, resetState } = useNexora();

  const modes: { id: OperatingMode; label: string; desc: string; icon: typeof Eye }[] = [
    {
      id: "MONITOR",
      label: "1. Monitor",
      desc: "Observe telemetry and baseline variances. No recommendations generated.",
      icon: Eye,
    },
    {
      id: "RECOMMEND",
      label: "2. Recommend",
      desc: "Detect inefficiencies and propose actions. Human review required for everything.",
      icon: Sparkles,
    },
    {
      id: "APPROVE",
      label: "3. Human Approval",
      desc: "Current Mode. Actions require facility manager one-click approval before dispatch.",
      icon: CheckCircle2,
    },
    {
      id: "AUTOMATE",
      label: "4. Autonomous",
      desc: "Pre-cleared low-risk setbacks execute automatically once all 5 safety gates pass.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="control-summary" className="py-20 sm:py-28 border-t border-[#E0DBD4] dark:border-[#333330]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="size-2 rounded-full bg-[#C05621]" />
            <span className="text-xs uppercase font-bold tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
              Facility Executive Control
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-[#141413] dark:text-[#F4F1EE] mb-4">
            You remain in complete control. Always.
          </h2>
          <p className="text-base sm:text-lg text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
            NEXORA is designed around the human operator. Choose how much autonomy you grant the system — from purely observing telemetry to authorizing automated closed-loop adjustments.
          </p>
        </div>

        {/* Operating Autonomy Levels */}
        <div className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-6 sm:p-10 shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E0DBD4] dark:border-[#333330]">
            <div>
              <span className="text-xs font-semibold text-[#6B6864] dark:text-[#A4A09B] uppercase tracking-wider">
                System Autonomy Policy
              </span>
              <h3 className="text-xl font-bold text-[#141413] dark:text-[#F4F1EE]">
                Human-in-the-Loop Governance
              </h3>
            </div>
            <div className="text-xs font-mono text-[#6B6864] dark:text-[#A4A09B]">
              Active policy: <span className="font-bold text-[#C05621] uppercase">{mode}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modes.map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setOperatingMode(m.id)}
                  className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isActive
                      ? "border-[#C05621] bg-[#FAF8F5] dark:bg-[#242422] shadow-sm ring-1 ring-[#C05621]"
                      : "border-[#E0DBD4] dark:border-[#333330] hover:border-[#6B6864] dark:hover:border-[#A4A09B]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`size-8 rounded-full flex items-center justify-center ${
                          isActive
                            ? "bg-[#C05621] text-white"
                            : "bg-[#FAF8F5] dark:bg-[#242422] text-[#6B6864] dark:text-[#A4A09B]"
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C05621] bg-[#C05621]/10 px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-base font-bold text-[#141413] dark:text-[#F4F1EE] mb-1.5">
                      {m.label}
                    </div>
                    <p className="text-xs text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Center Banner */}
        <div className="bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-8 sm:p-12 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div className="max-w-xl">
            <span className="text-xs font-mono uppercase tracking-wider text-[#C05621] font-bold">
              Facility Toolset
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413] dark:text-[#F4F1EE] mt-1 mb-3">
              Explore building tools &amp; scenarios
            </h3>
            <p className="text-sm text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
              Launch manual equipment overrides, inspect live telemetry across all 8 zones, or simulate weather and occupancy scenarios in the digital twin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenOverride}
              className="px-5 py-3 rounded-full text-xs font-semibold bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Sliders className="size-4" />
              Manual Override Drawer
            </button>

            <button
              onClick={onOpenZones}
              className="px-5 py-3 rounded-full text-xs font-semibold bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] text-[#141413] dark:text-[#F4F1EE] hover:bg-[#FAF8F5] dark:hover:bg-[#242422] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Layers className="size-4" />
              Inspect All 8 Zones
            </button>

            <button
              onClick={onOpenWhatIf}
              className="px-5 py-3 rounded-full text-xs font-semibold bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] text-[#141413] dark:text-[#F4F1EE] hover:bg-[#FAF8F5] dark:hover:bg-[#242422] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Activity className="size-4" />
              Digital Twin Simulator
            </button>

            <button
              onClick={() => resetState()}
              title="Reset live demo state to baseline"
              className="p-3 rounded-full border border-[#E0DBD4] dark:border-[#333330] text-[#6B6864] dark:text-[#A4A09B] hover:text-[#141413] dark:hover:text-[#F4F1EE] hover:bg-white dark:hover:bg-[#1D1D1B] transition-colors cursor-pointer"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>

        {/* Compliance & Standards Badges Footer */}
        <div className="pt-8 border-t border-[#E0DBD4] dark:border-[#333330] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#6B6864] dark:text-[#A4A09B]">
          <div className="flex items-center gap-4">
            <NexoraLogo size="sm" variant="mark" />
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <span>BACnet/IP &bull; Modbus TCP &bull; MQTT</span>
              <span>ASHRAE 55 &bull; 62.1</span>
              <span>IPMVP Option C</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#15803D]" />
            <span>NEXORA Retrofit Intelligence &bull; Production Ready</span>
          </div>
        </div>
      </div>
    </section>
  );
}
