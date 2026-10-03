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
import { motion } from "framer-motion";

export function EnergySection({
  onInspectZones,
}: {
  onInspectZones: () => void;
}) {
  const [showCooling, setShowCooling] = useState(true);

  return (
    <section id="energy-telemetry" className="py-20 sm:py-28 border-t border-[#E0DBD4] dark:border-[#333330]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="size-2 rounded-full bg-[#C05621]" />
              <span className="text-xs uppercase font-bold tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
                Expected vs Actual
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-[#141413] dark:text-[#F4F1EE] mb-3">
              Energy Demand vs. What Was Expected
            </h2>
            <p className="text-base sm:text-lg text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
              The dashed line shows what the building would have consumed under fixed operating schedules. The solid curve reveals how NEXORA curtails cooling and lighting when spaces empty out.
            </p>
          </div>

          {/* Quick CTA to explore 8 Zones */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onInspectZones}
              className="bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] px-6 py-3 rounded-full text-xs font-semibold tracking-tight hover:opacity-90 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Inspect All 8 Zones</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Large, Spacious Editorial Chart Container with Scroll Entrance */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
          className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-[32px] sm:rounded-[36px] p-6 sm:p-10 shadow-sm"
        >
          {/* Chart Controls & Filter Pill */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-5 border-b border-[#E0DBD4]/70 dark:border-[#333330]/70">
            <div className="flex flex-wrap items-center gap-5 text-xs">
              {/* Expected Baseline */}
              <div className="flex items-center gap-2.5">
                <span className="h-0.5 w-6 bg-[#6B6864] border-t-2 border-dashed border-[#6B6864]" />
                <span className="text-[#6B6864] dark:text-[#A4A09B] font-medium">Expected Baseline (Modelled)</span>
              </div>

              {/* Actual Active Power */}
              <div className="flex items-center gap-2.5">
                <span className="h-1 w-6 bg-[#141413] dark:bg-[#F4F1EE] rounded-full" />
                <span className="font-semibold text-[#141413] dark:text-[#F4F1EE]">Actual Active Power</span>
              </div>

              {/* Cooling Load */}
              {showCooling && (
                <div className="flex items-center gap-2.5">
                  <span className="h-1 w-6 bg-[#C05621] rounded-full" />
                  <span className="font-medium text-[#C05621]">HVAC Cooling Load</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCooling((v) => !v)}
              className="text-xs px-3.5 py-1.5 rounded-full border border-[#E0DBD4] dark:border-[#333330] hover:bg-[#FAF8F5] dark:hover:bg-[#2A2A28] text-[#6B6864] dark:text-[#A4A09B] transition-colors cursor-pointer"
            >
              {showCooling ? "Hide Cooling Breakdown" : "Show Cooling Breakdown"}
            </button>
          </div>

          {/* Generous Height Recharts Container */}
          <div className="h-[380px] sm:h-[440px] md:h-[480px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={TIMELINE_ENERGY_SERIES}
                margin={{ top: 25, right: 20, left: -10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="actualCurve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#141413" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#141413" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="coolingCurve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C05621" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#C05621" stopOpacity={0.01} />
                  </linearGradient>
                </defs>

                {/* Peak Tariff Window */}
                <ReferenceArea
                  x1="11:00"
                  x2="15:00"
                  fill="#C05621"
                  fillOpacity={0.05}
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
                  stroke="#C05621"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{
                    value: "14:15 IST (Suite B Vacated)",
                    position: "top",
                    fill: "#C05621",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />

                <XAxis
                  dataKey="time"
                  stroke="#8C8883"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#E0DBD4" }}
                />
                <YAxis
                  stroke="#8C8883"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  unit=" kW"
                  domain={[0, 40]}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#141413] text-[#F4F1EE] p-4 rounded-2xl shadow-2xl border border-[#333330] text-xs">
                          <div className="font-mono font-bold mb-2 pb-1.5 border-b border-[#333330] flex items-center justify-between gap-4">
                            <span>Time: {label} IST</span>
                            <span className="text-[10px] text-[#A4A09B] font-normal">SIMULATED DATA</span>
                          </div>
                          {payload.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between gap-6 py-1">
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
                  strokeWidth={2.2}
                  strokeDasharray="6 6"
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1100}
                />

                {/* Cooling Component */}
                {showCooling && (
                  <Area
                    type="monotone"
                    dataKey="coolingKw"
                    name="Cooling Load"
                    stroke="#C05621"
                    strokeWidth={2}
                    fill="url(#coolingCurve)"
                    isAnimationActive={true}
                    animationDuration={1300}
                  />
                )}

                {/* Gross Active Power */}
                <Area
                  type="monotone"
                  dataKey="actualKw"
                  name="Actual Active Power"
                  stroke="#141413"
                  strokeWidth={3}
                  fill="url(#actualCurve)"
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Minimal Editorial Footer Note */}
          <div className="mt-8 pt-5 border-t border-[#F4F1EE] dark:border-[#2A2A28] flex flex-wrap items-center justify-between gap-4 text-xs text-[#6B6864] dark:text-[#A4A09B]">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-[#C05621]" />
              <span>
                At 14:15, Zone 04 meeting vacated early. The pending setback recommendation eliminates an immediate 3.5 kW peak.
              </span>
            </div>
            <span className="font-mono text-[11px] uppercase">
              Protocol: IPMVP Option C &bull; Simulated Telemetry Dataset
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
