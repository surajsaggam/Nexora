"use client";

import React from "react";
import { useNexora } from "@/hooks/use-nexora";
import { ZoneData } from "@/types/nexora";
import {
  Users,
  Thermometer,
  Wind,
  Zap,
  Sliders,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ZoneMonitoringGrid({
  onSelectZoneForOverride,
}: {
  onSelectZoneForOverride: (zone: ZoneData) => void;
}) {
  const { zones } = useNexora();

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#141413] dark:bg-[#F4F1EE]" />
            <h3 className="font-semibold text-base tracking-tight text-[#141413] dark:text-[#F4F1EE]">
              Zone Intelligence &amp; Telemetry Matrix (8 Zones)
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#2A2A28] border border-[#E0DBD4] dark:border-[#333330] text-[#6B6864] dark:text-[#A4A09B]">
              FLOOR 4 • 1,000 M²
            </span>
          </div>
          <p className="text-xs text-[#6B6864] dark:text-[#A4A09B] mt-0.5">
            Continuous zone-level environmental &amp; electrical sensing. Click &quot;Control&quot; to access direct physical setpoint overrides.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {zones.map((zone) => {
          const isComfortable =
            zone.temperature >= zone.comfortBand.minTemp &&
            zone.temperature <= zone.comfortBand.maxTemp;
          const isIaqNominal = zone.co2 <= zone.comfortBand.maxCo2;
          const isOverconsuming = zone.totalZonePowerKw > zone.baselineExpectedKw + 1.0;

          return (
            <div
              key={zone.id}
              className={cn(
                "bg-white dark:bg-[#1D1D1B] border rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md",
                zone.hasActiveAnomaly
                  ? "border-[#C05621] ring-1 ring-[#C05621]/20 bg-[#C05621]/[0.02]"
                  : "border-[#E0DBD4] dark:border-[#333330]"
              )}
            >
              {/* Zone Header */}
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#2A2A28] border border-[#E0DBD4] dark:border-[#333330] text-[#6B6864] dark:text-[#A4A09B]">
                    {zone.code}
                  </span>
                  <div className="flex items-center gap-1">
                    {zone.isManualOverride && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#1E3A8A] text-white">
                        OVERRIDE
                      </span>
                    )}
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#F4F1EE] dark:bg-[#2A2A28] text-[#6B6864] dark:text-[#A4A09B]">
                      {zone.evidence}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <h4 className="font-bold text-sm tracking-tight text-[#141413] dark:text-[#F4F1EE] truncate">
                    {zone.name}
                  </h4>
                  <span className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] shrink-0 font-medium">
                    {zone.areaSqM} m²
                  </span>
                </div>

                {/* Anomaly Banner if active */}
                {zone.hasActiveAnomaly && (
                  <div className="mb-2.5 p-2 rounded-xl bg-[#C05621]/10 border border-[#C05621]/30 text-[#C05621] text-[11px] flex items-start gap-1.5 leading-tight">
                    <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                    <span>{zone.anomalyDescription}</span>
                  </div>
                )}

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  {/* Occupancy */}
                  <div className="bg-[#FAF8F5] dark:bg-[#242422] p-2 rounded-xl border border-[#E0DBD4]/60 dark:border-[#333330]/60">
                    <div className="flex items-center justify-between text-[#6B6864] dark:text-[#A4A09B] text-[10px] mb-0.5">
                      <span className="flex items-center gap-1 font-semibold uppercase">
                        <Users className="size-3" />
                        Occupancy
                      </span>
                      <span className="font-mono text-[9px]">{zone.occupancyTrend}</span>
                    </div>
                    <div className="font-bold text-sm text-[#141413] dark:text-[#F4F1EE]">
                      {zone.currentOccupancy}{" "}
                      <span className="text-[11px] font-normal text-[#6B6864] dark:text-[#A4A09B]">
                        / {zone.maxCapacity}
                      </span>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="bg-[#FAF8F5] dark:bg-[#242422] p-2 rounded-xl border border-[#E0DBD4]/60 dark:border-[#333330]/60">
                    <div className="flex items-center justify-between text-[#6B6864] dark:text-[#A4A09B] text-[10px] mb-0.5">
                      <span className="flex items-center gap-1 font-semibold uppercase">
                        <Thermometer className="size-3" />
                        Climate
                      </span>
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          isComfortable ? "bg-[#15803D]" : "bg-[#C05621]"
                        )}
                      />
                    </div>
                    <div className="font-bold text-sm text-[#141413] dark:text-[#F4F1EE]">
                      {zone.temperature.toFixed(1)}°C{" "}
                      <span className="text-[10px] font-normal text-[#6B6864] dark:text-[#A4A09B]">
                        (Set: {zone.targetSetpoint}°C)
                      </span>
                    </div>
                  </div>

                  {/* CO2 & Humidity */}
                  <div className="bg-[#FAF8F5] dark:bg-[#242422] p-2 rounded-xl border border-[#E0DBD4]/60 dark:border-[#333330]/60">
                    <div className="flex items-center justify-between text-[#6B6864] dark:text-[#A4A09B] text-[10px] mb-0.5">
                      <span className="flex items-center gap-1 font-semibold uppercase">
                        <Wind className="size-3" />
                        IAQ / CO₂
                      </span>
                      <span
                        className={cn(
                          "text-[9px] font-bold",
                          isIaqNominal ? "text-[#15803D]" : "text-[#C05621]"
                        )}
                      >
                        {isIaqNominal ? "Good" : "Elevated"}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-[#141413] dark:text-[#F4F1EE]">
                      {zone.co2}{" "}
                      <span className="text-[10px] font-normal text-[#6B6864] dark:text-[#A4A09B]">
                        ppm ({zone.humidity}%)
                      </span>
                    </div>
                  </div>

                  {/* Zone Power & Baseline */}
                  <div className="bg-[#FAF8F5] dark:bg-[#242422] p-2 rounded-xl border border-[#E0DBD4]/60 dark:border-[#333330]/60">
                    <div className="flex items-center justify-between text-[#6B6864] dark:text-[#A4A09B] text-[10px] mb-0.5">
                      <span className="flex items-center gap-1 font-semibold uppercase">
                        <Zap className="size-3" />
                        Power
                      </span>
                      <span
                        className={cn(
                          "text-[9px] font-bold",
                          isOverconsuming ? "text-[#C05621]" : "text-[#15803D]"
                        )}
                      >
                        {isOverconsuming ? "High" : "Optimal"}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-[#141413] dark:text-[#F4F1EE]">
                      {zone.totalZonePowerKw}{" "}
                      <span className="text-[10px] font-normal text-[#6B6864] dark:text-[#A4A09B]">
                        / {zone.baselineExpectedKw} kW
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Sub-load pills & Manual Override button */}
              <div className="pt-2 border-t border-[#F4F1EE] dark:border-[#2A2A28] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-[#6B6864] dark:text-[#A4A09B]">
                  <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#2A2A28] font-mono text-[10px]">
                    HVAC: {zone.hvacMode}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#2A2A28] font-mono text-[10px]">
                    Light: {zone.lightingLevelPercent}%
                  </span>
                </div>

                <button
                  onClick={() => onSelectZoneForOverride(zone)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-[#E0DBD4] dark:border-[#333330] hover:bg-[#141413] hover:text-[#F4F1EE] dark:hover:bg-[#F4F1EE] dark:hover:text-[#141413] transition-colors btn-press flex items-center gap-1 text-[#141413] dark:text-[#F4F1EE]"
                >
                  <Sliders className="size-3" />
                  <span>Control</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
