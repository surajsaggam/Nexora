"use client";

import React, { useState } from "react";
import { useNexora } from "@/hooks/use-nexora";
import { ZoneData } from "@/types/nexora";
import {
  X,
  Users,
  Thermometer,
  Zap,
  Sliders,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Wind,
  Droplets,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectZoneForOverride: (zone: ZoneData) => void;
}

type FilterTab = "all" | "attention" | "normal";

export function ZoneInspectionModal({
  isOpen,
  onClose,
  onSelectZoneForOverride,
}: Props) {
  const { zones } = useNexora();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>("zone-04");

  if (!isOpen) return null;

  const getZoneStatus = (
    zone: ZoneData
  ): {
    label: string;
    variant: "opportunity" | "attention" | "normal";
  } => {
    if (zone.code === "Z04-CSB" || (zone.hasActiveAnomaly && zone.code.includes("04"))) {
      return { label: "OPPORTUNITY", variant: "opportunity" };
    }
    if (zone.hasActiveAnomaly) {
      return { label: "ATTENTION", variant: "attention" };
    }
    return { label: "NORMAL", variant: "normal" };
  };

  const filteredZones = zones.filter((zone) => {
    const status = getZoneStatus(zone);
    if (activeTab === "attention") {
      return status.variant === "opportunity" || status.variant === "attention";
    }
    if (activeTab === "normal") {
      return status.variant === "normal";
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedZoneId((prev) => (prev === id ? null : id));
  };

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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF8F5] dark:bg-[#191918] border border-[#E0DBD4] dark:border-[#333330] rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 max-w-5xl w-full shadow-2xl my-auto flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] overflow-hidden"
      >
        {/* Modal Header — Editorial, Calm, Clear */}
        <div className="flex items-start justify-between pb-6 border-b border-[#E0DBD4] dark:border-[#333330] shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-[#C05621]" />
              <span className="text-xs uppercase font-bold tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
                Building Telemetry Stream
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413]">
                SIMULATED DATA
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-[#141413] dark:text-[#F4F1EE]">
              Floor 4: 8 Monitored Zones
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6864] dark:text-[#A4A09B] mt-1">
              Apex Horizon Complex &bull; 1,000 m² total conditioned space &bull; BACnet/IP Edge Gateway
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2.5 rounded-full hover:bg-[#EAE6E1] dark:hover:bg-[#2A2A28] text-[#6B6864] dark:text-[#A4A09B] transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Filter Tabs & Summary Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-[#E0DBD4] dark:border-[#333330] shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                activeTab === "all"
                  ? "bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413]"
                  : "bg-white dark:bg-[#242422] text-[#6B6864] dark:text-[#A4A09B] border border-[#E0DBD4] dark:border-[#333330]"
              )}
            >
              All Zones ({zones.length})
            </button>

            <button
              onClick={() => setActiveTab("attention")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "attention"
                  ? "bg-[#C05621] text-white"
                  : "bg-white dark:bg-[#242422] text-[#C05621] border border-[#E0DBD4] dark:border-[#333330]"
              )}
            >
              <Sparkles className="size-3" />
              <span>Opportunities (1)</span>
            </button>

            <button
              onClick={() => setActiveTab("normal")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                activeTab === "normal"
                  ? "bg-[#15803D] text-white"
                  : "bg-white dark:bg-[#242422] text-[#6B6864] dark:text-[#A4A09B] border border-[#E0DBD4] dark:border-[#333330]"
              )}
            >
              Normal (7)
            </button>
          </div>

          <div className="text-xs text-[#6B6864] dark:text-[#A4A09B] font-mono">
            Showing {filteredZones.length} of 8 zones
          </div>
        </div>

        {/* Scrollable Zone List with Breathing Room & Progressive Disclosure */}
        <div className="overflow-y-auto py-4 space-y-3.5 pr-1 flex-1 overscroll-contain">
          {filteredZones.map((zone) => {
            const status = getZoneStatus(zone);
            const isExpanded = expandedZoneId === zone.id;
            const isHero = status.variant === "opportunity";

            return (
              <div
                key={zone.id}
                className={cn(
                  "rounded-2xl transition-all duration-200 border bg-white dark:bg-[#212120] overflow-hidden",
                  isHero
                    ? "border-[#C05621] shadow-md ring-1 ring-[#C05621]/30 bg-[#C05621]/[0.02]"
                    : "border-[#E0DBD4] dark:border-[#333330] hover:border-[#6B6864] dark:hover:border-[#555550]"
                )}
              >
                {/* Primary Card View (Prioritizing Zone Name, Occupancy, Temperature, Power, Status) */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Identification & Status */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-[260px]">
                    <div
                      className={cn(
                        "size-10 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold",
                        isHero
                          ? "bg-[#C05621] text-white"
                          : "bg-[#FAF8F5] dark:bg-[#2A2A28] border border-[#E0DBD4] dark:border-[#333330] text-[#141413] dark:text-[#F4F1EE]"
                      )}
                    >
                      {zone.code.split("-")[0]?.replace("Z0", "Z") || zone.code}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-[#141413] dark:text-[#F4F1EE] tracking-tight">
                          {zone.name}
                        </h4>
                        {/* Status Badge */}
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                            status.variant === "opportunity"
                              ? "bg-[#C05621]/15 text-[#C05621] border border-[#C05621]/30"
                              : status.variant === "attention"
                              ? "bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/30"
                              : "bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20"
                          )}
                        >
                          {status.variant === "opportunity" && <Sparkles className="size-2.5" />}
                          {status.variant === "normal" && <CheckCircle2 className="size-2.5" />}
                          {status.label}
                        </span>
                      </div>
                      <div className="text-xs text-[#6B6864] dark:text-[#A4A09B] mt-0.5">
                        {zone.areaSqM} m² &bull; Floor {zone.floor} &bull; Mode: {zone.hvacMode}
                      </div>
                    </div>
                  </div>

                  {/* Center: 3 Primary Metrics with Clear Hierarchy */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-6 flex-1 max-w-md">
                    {/* Priority 1: Occupancy */}
                    <div>
                      <div className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] flex items-center gap-1">
                        <Users className="size-3" />
                        <span>Occupants</span>
                      </div>
                      <div className="text-base font-bold font-mono text-[#141413] dark:text-[#F4F1EE] mt-0.5">
                        {zone.currentOccupancy}{" "}
                        <span className="text-xs font-normal text-[#6B6864]">/ {zone.maxCapacity}</span>
                      </div>
                    </div>

                    {/* Priority 2: Temperature */}
                    <div>
                      <div className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] flex items-center gap-1">
                        <Thermometer className="size-3" />
                        <span>Temp</span>
                      </div>
                      <div className="text-base font-bold font-mono text-[#141413] dark:text-[#F4F1EE] mt-0.5">
                        {zone.temperature.toFixed(1)}°C
                      </div>
                    </div>

                    {/* Priority 3: Active Power */}
                    <div>
                      <div className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] flex items-center gap-1">
                        <Zap className="size-3 text-[#C05621]" />
                        <span>Power</span>
                      </div>
                      <div
                        className={cn(
                          "text-base font-bold font-mono mt-0.5",
                          isHero ? "text-[#C05621]" : "text-[#141413] dark:text-[#F4F1EE]"
                        )}
                      >
                        {zone.totalZonePowerKw.toFixed(1)} <span className="text-xs font-sans text-[#6B6864]">kW</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Expand Toggle & Manual Override Trigger */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => toggleExpand(zone.id)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-[#E0DBD4] dark:border-[#333330] hover:bg-[#FAF8F5] dark:hover:bg-[#2A2A28] text-[#141413] dark:text-[#F4F1EE] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{isExpanded ? "Less Details" : "Inspect"}</span>
                      {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onSelectZoneForOverride(zone);
                      }}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
                    >
                      <Sliders className="size-3" />
                      <span>Override</span>
                    </button>
                  </div>
                </div>

                {/* Progressive Disclosure Drawer (Revealed on Inspect Click) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-[#E0DBD4] dark:border-[#333330] bg-[#FAF8F5]/80 dark:bg-[#1D1D1B]/80 p-5 text-xs"
                    >
                      {/* Alert banner if anomaly */}
                      {zone.hasActiveAnomaly && (
                        <div className="mb-4 p-3 rounded-xl bg-[#C05621]/10 border border-[#C05621]/30 text-[#C05621] flex items-center gap-2">
                          <AlertTriangle className="size-4 shrink-0" />
                          <span className="font-medium">{zone.anomalyDescription}</span>
                        </div>
                      )}

                      {/* Secondary Telemetry Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white dark:bg-[#242422] p-3 rounded-xl border border-[#E0DBD4] dark:border-[#333330]">
                          <span className="text-[10px] text-[#6B6864] dark:text-[#A4A09B] uppercase font-semibold flex items-center gap-1">
                            <Wind className="size-3" /> CO₂ Air Quality
                          </span>
                          <div className="text-base font-bold font-mono text-[#141413] dark:text-[#F4F1EE] mt-1">
                            {zone.co2} ppm
                          </div>
                          <span className="text-[10px] text-[#15803D]">Safe (&lt; 950 ppm)</span>
                        </div>

                        <div className="bg-white dark:bg-[#242422] p-3 rounded-xl border border-[#E0DBD4] dark:border-[#333330]">
                          <span className="text-[10px] text-[#6B6864] dark:text-[#A4A09B] uppercase font-semibold flex items-center gap-1">
                            <Thermometer className="size-3" /> Target Setpoint
                          </span>
                          <div className="text-base font-bold font-mono text-[#141413] dark:text-[#F4F1EE] mt-1">
                            {zone.targetSetpoint.toFixed(1)}°C
                          </div>
                          <span className="text-[10px] text-[#6B6864]">Band: 20°C - 24.5°C</span>
                        </div>

                        <div className="bg-white dark:bg-[#242422] p-3 rounded-xl border border-[#E0DBD4] dark:border-[#333330]">
                          <span className="text-[10px] text-[#6B6864] dark:text-[#A4A09B] uppercase font-semibold flex items-center gap-1">
                            <Zap className="size-3" /> Expected Baseline
                          </span>
                          <div className="text-base font-bold font-mono text-[#141413] dark:text-[#F4F1EE] mt-1">
                            {zone.baselineExpectedKw.toFixed(1)} kW
                          </div>
                          <span className="text-[10px] text-[#6B6864]">ML trained baseline</span>
                        </div>

                        <div className="bg-white dark:bg-[#242422] p-3 rounded-xl border border-[#E0DBD4] dark:border-[#333330]">
                          <span className="text-[10px] text-[#6B6864] dark:text-[#A4A09B] uppercase font-semibold flex items-center gap-1">
                            <Droplets className="size-3" /> Humidity
                          </span>
                          <div className="text-base font-bold font-mono text-[#141413] dark:text-[#F4F1EE] mt-1">
                            {zone.humidity}%
                          </div>
                          <span className="text-[10px] text-[#15803D]">Optimal (40-60%)</span>
                        </div>
                      </div>

                      {/* Equipment Status & Evidence Tag */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E0DBD4] dark:border-[#333330] text-[11px] text-[#6B6864] dark:text-[#A4A09B]">
                        <div>
                          HVAC Fan: <strong className="text-[#141413] dark:text-[#F4F1EE]">{zone.hvacFanSpeed}</strong> &bull; Lighting: <strong className="text-[#141413] dark:text-[#F4F1EE]">{zone.lightingLevelPercent}%</strong> ({zone.lightingPowerKw} kW)
                        </div>
                        <div className="font-mono">
                          Evidence: <span className="font-bold text-[#141413] dark:text-[#F4F1EE]">{zone.evidence}</span> (BACnet/Modbus simulation dataset)
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#E0DBD4] dark:border-[#333330] flex items-center justify-between text-xs text-[#6B6864] dark:text-[#A4A09B] shrink-0">
          <span>8 active zone sensors connected to edge gateway via BACnet/IP</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] hover:opacity-90 transition-all cursor-pointer"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}
