"use client";

import React from "react";
import { useNexora } from "@/hooks/use-nexora";
import { ZoneData } from "@/types/nexora";
import { X, Users, Thermometer, Wind, Zap, Sliders, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectZoneForOverride: (zone: ZoneData) => void;
}

export function ZoneInspectionModal({ isOpen, onClose, onSelectZoneForOverride }: Props) {
  const { zones } = useNexora();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-6 sm:p-8 max-w-5xl w-full shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E0DBD4] dark:border-[#333330] mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="size-2 rounded-full bg-[#141413] dark:bg-[#F4F1EE]" />
              <h3 className="font-bold text-xl text-[#141413] dark:text-[#F4F1EE] tracking-tight">
                Apex Horizon Complex — All 8 Zone Telemetry Streams
              </h3>
            </div>
            <p className="text-xs text-[#6B6864] dark:text-[#A4A09B]">
              Floor 4 (1,000 m²) • Live Modbus &amp; BACnet gateway sensor feeds
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#EAE6E1] dark:hover:bg-[#2A2A28] text-[#6B6864] transition-colors btn-press"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 8-Zone Grid inside Modal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {zones.map((zone) => {
            const isComfortable =
              zone.temperature >= zone.comfortBand.minTemp &&
              zone.temperature <= zone.comfortBand.maxTemp;
            const isOverconsuming = zone.totalZonePowerKw > zone.baselineExpectedKw + 1.0;

            return (
              <div
                key={zone.id}
                className={cn(
                  "bg-white dark:bg-[#242422] border rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all duration-200",
                  zone.hasActiveAnomaly
                    ? "border-[#C05621] ring-1 ring-[#C05621]/20 bg-[#C05621]/[0.02]"
                    : "border-[#E0DBD4] dark:border-[#333330]"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] text-[#6B6864] dark:text-[#A4A09B]">
                      {zone.code}
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#F4F1EE] dark:bg-[#2A2A28] text-[#6B6864] dark:text-[#A4A09B]">
                      {zone.evidence}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm tracking-tight text-[#141413] dark:text-[#F4F1EE] truncate mb-2">
                    {zone.name}
                  </h4>

                  {zone.hasActiveAnomaly && (
                    <div className="mb-2 p-2 rounded-xl bg-[#C05621]/10 border border-[#C05621]/30 text-[#C05621] text-[10px] flex items-start gap-1 leading-tight">
                      <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                      <span>{zone.anomalyDescription}</span>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs mb-3">
                    <div className="flex items-center justify-between text-[#6B6864] dark:text-[#A4A09B]">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Users className="size-3" /> Occupancy:
                      </span>
                      <span className="font-bold text-[#141413] dark:text-[#F4F1EE]">
                        {zone.currentOccupancy} / {zone.maxCapacity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#6B6864] dark:text-[#A4A09B]">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Thermometer className="size-3" /> Temp:
                      </span>
                      <span className={cn("font-bold", isComfortable ? "text-[#15803D]" : "text-[#C05621]")}>
                        {zone.temperature.toFixed(1)}°C (Set: {zone.targetSetpoint}°C)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#6B6864] dark:text-[#A4A09B]">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Wind className="size-3" /> CO₂ Air:
                      </span>
                      <span className="font-mono font-medium text-[#141413] dark:text-[#F4F1EE]">
                        {zone.co2} ppm
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#6B6864] dark:text-[#A4A09B]">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Zap className="size-3" /> Power:
                      </span>
                      <span className={cn("font-bold", isOverconsuming ? "text-[#C05621]" : "text-[#141413] dark:text-[#F4F1EE]")}>
                        {zone.totalZonePowerKw} kW <span className="font-normal text-[10px] text-[#6B6864]">({zone.baselineExpectedKw} kW exp)</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onSelectZoneForOverride(zone);
                  }}
                  className="w-full py-1.5 rounded-full text-xs font-semibold border border-[#E0DBD4] dark:border-[#333330] hover:bg-[#141413] hover:text-white dark:hover:bg-white dark:hover:text-[#141413] transition-colors btn-press flex items-center justify-center gap-1.5"
                >
                  <Sliders className="size-3" />
                  <span>Manual Override</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E0DBD4] dark:border-[#333330] text-xs text-[#6B6864] dark:text-[#A4A09B]">
          <span>8 active zone sensors connected to edge gateway via BACnet/IP</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] hover:opacity-90 transition-all btn-press"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
