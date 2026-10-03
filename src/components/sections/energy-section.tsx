"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { TIMELINE_ENERGY_SERIES } from "@/lib/simulation-engine";
import { Info, ArrowRight } from "lucide-react";

export function EnergySection({
  onInspectZones,
}: {
  onInspectZones: () => void;
}) {
  const [showCooling, setShowCooling] = useState(true);

  return (
    <section className="py-16 sm:py-24 border-t border-[#E0DBD4] dark:border-[#333330]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="size-2 rounded-full bg-[#1E3A8A]" />
              <span className="text-xs uppercase font-bold tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
                Whole-Building Telemetry
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-[#141413] dark:text-[#F4F1EE] mb-3">
              Energy Demand vs. What Was Expected
            </h2>
            <p className="text-base text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
              The dashed line shows what the building would have consumed under fixed operating schedules. The solid curve reveals how NEXORA curtails cooling and lighting when spaces empty out.
            </p>
          </div>

          {/* Quick CTA to explore 8 Zones */}
          <div className="flex items-center gap-3">
            <button
              onClick={onInspectZones}
              className="bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] px-5 py-2.5 rounded-full text-xs font-bold tracking-tight hover:opacity-90 transition-all btn-press flex items-center gap-2 shadow-sm"
            >
              <span>Inspect All 8 Zones</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Large, Spacious Editorial Chart Container */}
        <div className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-6 sm:p-10 shadow-sm">
          {/* Chart Controls & Filter Pill */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-0.5 w-5 bg-[#6B6864] border-t border-dashed border-[#6B6864]" />
                <span className="text-[#6B6864] dark:text-[#A4A09B] font-medium">Expected Baseline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1 w-5 bg-[#141413] dark:bg-[#F4F1EE] rounded-full" />
                <span className="font-semibold text-[#141413] dark:text-[#F4F1EE]">Actual Active Power</span>
              </div>
              {showCooling && (
                <div className="flex items-center gap-2">
                  <span className="h-1 w-5 bg-[#C05621] rounded-full" />
                  <span className="font-medium text-[#C05621]">Cooling Load</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCooling((v) => !v)}
              className="text-xs px-3 py-1 rounded-full border border-[#E0DBD4] dark:border-[#333330] hover:bg-[#FAF8F5] dark:hover:bg-[#2A2A28] text-[#6B6864] transition-colors btn-press"
            >
              {showCooling ? "Hide Cooling Breakdown" : "Show Cooling Breakdown"}
            </button>
          </div>

          {/* Large Recharts Container */}
          <div className="h-[340px] sm:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={TIMELINE_ENERGY_SERIES}
                margin={{ top: 15, right: 15, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="actualCurve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#141413" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#141413" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="coolingCurve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C05621" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#C05621" stopOpacity={0} />
                  </linearGradient>
                </defs>

                {/* Peak Tariff Window */}
                <ReferenceArea
                  x1="11:00"
                  x2="15:00"
                  fill="#C05621"
                  fillOpacity={0.06}
                  label={{
                    value: "Peak Tariff Band (11:00 - 15:00)",
                    position: "insideTopRight",
                    fill: "#C05621",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />

                {/* Current Time Indicator */}
                <ReferenceLine
                  x="14:00"
                  stroke="#15803D"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{
                    value: "Current (14:15 IST)",
                    position: "top",
                    fill: "#15803D",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />

                <XAxis
                  dataKey="time"
                  stroke="#A4A09B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#E0DBD4" }}
                />
                <YAxis
                  stroke="#A4A09B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  unit=" kW"
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#141413] text-[#F4F1EE] p-3.5 rounded-2xl shadow-xl border border-[#333330] text-xs">
                          <div className="font-mono font-bold mb-1.5 pb-1 border-b border-[#333330]">
                            Time: {label} IST
                          </div>
                          {payload.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between gap-5 py-0.5">
                              <span style={{ color: entry.color }} className="font-medium">
                                {entry.name}:
                              </span>
                              <span className="font-mono font-bold">{entry.value} kW</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Expected Baseline Line */}
                <Line
                  type="monotone"
                  dataKey="baselineKw"
                  name="Baseline Expected"
                  stroke="#6B6864"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />

                {/* Cooling Component */}
                {showCooling && (
                  <Area
                    type="monotone"
                    dataKey="coolingKw"
                    name="HVAC Cooling"
                    stroke="#C05621"
                    strokeWidth={2}
                    fill="url(#coolingCurve)"
                  />
                )}

                {/* Gross Active Power */}
                <Area
                  type="monotone"
                  dataKey="actualKw"
                  name="Gross Active Power"
                  stroke="#141413"
                  strokeWidth={2.5}
                  fill="url(#actualCurve)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Minimal Editorial Footer Note */}
          <div className="mt-6 pt-4 border-t border-[#F4F1EE] dark:border-[#2A2A28] flex flex-wrap items-center justify-between gap-4 text-xs text-[#6B6864] dark:text-[#A4A09B]">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-[#C05621]" />
              <span>
                At 14:15, Zone 04 meeting vacated early. The pending recommendation below will shed an immediate 3.5 kW peak.
              </span>
            </div>
            <span className="font-mono text-[11px] uppercase">
              Protocol: IPMVP Option C Smart Meter Telemetry
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
