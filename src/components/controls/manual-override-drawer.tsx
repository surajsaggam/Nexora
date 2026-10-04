"use client";

import React, { useState } from "react";
import { ZoneData } from "@/types/nexora";
import { useNexora } from "@/hooks/use-nexora";
import { X, Sliders, Thermometer, Lightbulb, RotateCcw, AlertTriangle } from "lucide-react";

interface Props {
  zone: ZoneData | null;
  onClose: () => void;
}

function DrawerForm({ zone, onClose }: { zone: ZoneData; onClose: () => void }) {
  const { applyManualOverride, releaseManualOverride } = useNexora();

  const [setpoint, setSetpoint] = useState<number>(zone.targetSetpoint);
  const [lighting, setLighting] = useState<number>(zone.lightingLevelPercent);
  const [mode, setMode] = useState<"COOLING" | "STANDBY" | "SETBACK" | "OFF">(
    zone.hvacMode === "VENTILATION" ? "STANDBY" : zone.hvacMode
  );

  const handleApply = () => {
    applyManualOverride(zone.id, setpoint, lighting, mode);
    onClose();
  };

  const handleRelease = () => {
    releaseManualOverride(zone.id);
    onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[88vh] my-auto overflow-hidden"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E0DBD4] dark:border-[#333330] mb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-full bg-[#141413] text-[#F4F1EE] flex items-center justify-center">
            <Sliders className="size-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#141413] dark:text-[#F4F1EE]">
              Manual Override: {zone.name}
            </h3>
            <p className="text-xs text-[#6B6864] dark:text-[#A4A09B]">
              {zone.code} • Floor {zone.floor} • {zone.areaSqM} m²
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

      {/* Scrollable Form Body */}
      <div className="overflow-y-auto flex-1 pr-1.5 -mr-1 space-y-4 overscroll-contain">
        {/* Warning Callout */}
        <div className="p-3 rounded-xl bg-[#C05621]/10 border border-[#C05621]/30 text-xs text-[#C05621] flex items-start gap-2 leading-snug">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>
            Manual override takes precedence over AI automated optimization. Physical commands will be dispatched via edge gateway over BACnet MSTP.
          </span>
        </div>
      <div className="space-y-4 mb-6">
        {/* Temperature Setpoint Slider */}
        <div className="bg-[#FAF8F5] dark:bg-[#242422] p-3.5 rounded-2xl border border-[#E0DBD4] dark:border-[#333330]">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-[#141413] dark:text-[#F4F1EE]">
              <Thermometer className="size-3.5 text-[#C05621]" />
              HVAC Temperature Setpoint
            </span>
            <span className="font-mono text-sm font-bold text-[#141413] dark:text-[#F4F1EE]">
              {setpoint.toFixed(1)}°C
            </span>
          </div>
          <input
            type="range"
            min="19.0"
            max="27.0"
            step="0.5"
            value={setpoint}
            onChange={(e) => setSetpoint(parseFloat(e.target.value))}
            className="w-full accent-[#141413] dark:accent-[#F4F1EE] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#6B6864] dark:text-[#A4A09B] mt-1 font-mono">
            <span>19.0°C (Max Cooling)</span>
            <span>Comfort Band: {zone.comfortBand.minTemp}°C - {zone.comfortBand.maxTemp}°C</span>
            <span>27.0°C (Economy)</span>
          </div>
        </div>

        {/* Lighting Trim Slider */}
        <div className="bg-[#FAF8F5] dark:bg-[#242422] p-3.5 rounded-2xl border border-[#E0DBD4] dark:border-[#333330]">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-[#141413] dark:text-[#F4F1EE]">
              <Lightbulb className="size-3.5 text-[#C05621]" />
              Lighting Ballast Output
            </span>
            <span className="font-mono text-sm font-bold text-[#141413] dark:text-[#F4F1EE]">
              {lighting}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={lighting}
            onChange={(e) => setLighting(parseInt(e.target.value))}
            className="w-full accent-[#141413] dark:accent-[#F4F1EE] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#6B6864] dark:text-[#A4A09B] mt-1 font-mono">
            <span>0% (Off)</span>
            <span>Standard: 80%</span>
            <span>100% (Full)</span>
          </div>
        </div>

        {/* HVAC Operating Mode */}
        <div className="bg-[#FAF8F5] dark:bg-[#242422] p-3.5 rounded-2xl border border-[#E0DBD4] dark:border-[#333330]">
          <span className="text-xs font-semibold text-[#141413] dark:text-[#F4F1EE] block mb-2">
            HVAC Mode Selection
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {(["COOLING", "STANDBY", "SETBACK", "OFF"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all btn-press ${
                  mode === m
                    ? "bg-[#141413] text-white shadow-sm"
                    : "bg-white dark:bg-[#1D1D1B] text-[#6B6864] border border-[#E0DBD4] dark:border-[#333330]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Footer Actions — pinned */}
      <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-[#E0DBD4] dark:border-[#333330] shrink-0">
        {zone.isManualOverride ? (
          <button
            onClick={handleRelease}
            className="px-4 py-2 rounded-full text-xs font-semibold border border-[#E0DBD4] dark:border-[#333330] hover:bg-[#EAE6E1] dark:hover:bg-[#2A2A28] text-[#C05621] transition-colors btn-press flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>Release to Auto BMS</span>
          </button>
        ) : (
          <div className="text-[11px] text-[#6B6864] dark:text-[#A4A09B]">
            Currently governed by baseline schedules
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold border border-[#E0DBD4] dark:border-[#333330] hover:bg-[#EAE6E1] dark:hover:bg-[#2A2A28] text-[#6B6864] transition-colors btn-press cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-full text-xs font-bold bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] hover:opacity-90 transition-all shadow-sm btn-press cursor-pointer"
          >
            Apply Override
          </button>
        </div>
      </div>
    </div>
  );
}

export function ManualOverrideDrawer({ zone, onClose }: Props) {
  React.useEffect(() => {
    if (!zone) return;
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
  }, [zone, onClose]);

  if (!zone) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <DrawerForm key={zone.id} zone={zone} onClose={onClose} />
    </div>
  );
}
