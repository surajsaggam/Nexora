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
import { useNexora } from "@/hooks/use-nexora";
import { Info } from "lucide-react";

export function EnergyAnalyticsCard() {
  const { kpis } = useNexora();
  const [showCooling, setShowCooling] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);

  return (
    <div className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-5 shadow-sm w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#141413] dark:bg-[#F4F1EE]" />
            <h3 className="font-semibold text-base tracking-tight text-[#141413] dark:text-[#F4F1EE]">
              24-Hour Energy Telemetry vs Expected Baseline
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#2A2A28] border border-[#E0DBD4] dark:border-[#333330] text-[#6B6864] dark:text-[#A4A09B]">
              EVIDENCE: SIMULATED BASELINE + INTERVENTION
            </span>
          </div>
          <p className="text-xs text-[#6B6864] dark:text-[#A4A09B] mt-0.5">
            Smart-meter demand profile comparing trained baseline with simulated zone telemetry. Shaded zone marks 11:00–15:00 peak tariff window.
          </p>
        </div>

        {/* Legend / Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowBaseline((v) => !v)}
            className={`px-3 py-1 rounded-full border transition-all btn-press ${
              showBaseline
                ? "bg-[#141413] text-white border-[#141413]"
                : "bg-transparent text-[#6B6864] border-[#E0DBD4]"
            }`}
          >
            Expected Baseline
          </button>
          <button
            onClick={() => setShowCooling((v) => !v)}
            className={`px-3 py-1 rounded-full border transition-all btn-press ${
              showCooling
                ? "bg-[#C05621] text-white border-[#C05621]"
                : "bg-transparent text-[#6B6864] border-[#E0DBD4]"
            }`}
          >
            HVAC Cooling Load
          </button>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={TIMELINE_ENERGY_SERIES}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#141413" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#141413" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="coolingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C05621" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#C05621" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Peak Tariff Window: 11:00 to 15:00 */}
            <ReferenceArea
              x1="11:00"
              x2="15:00"
              fill="#C05621"
              fillOpacity={0.06}
              label={{
                value: "Peak Tariff Band (₹12.50/kWh)",
                position: "insideTopRight",
                fill: "#C05621",
                fontSize: 10,
                fontWeight: 600,
              }}
            />

            {/* Current Timeline Marker: 14:00 */}
            <ReferenceLine
              x="14:00"
              stroke="#15803D"
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{
                value: "Current (14:15)",
                position: "top",
                fill: "#15803D",
                fontSize: 10,
                fontWeight: 600,
              }}
            />

            <XAxis
              dataKey="time"
              stroke="#A4A09B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#E0DBD4" }}
            />
            <YAxis
              stroke="#A4A09B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit=" kW"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#141413] text-[#F4F1EE] p-3 rounded-xl shadow-lg border border-[#333330] text-xs">
                      <div className="font-mono font-bold mb-1 border-b border-[#333330] pb-1">
                        Time: {label}
                      </div>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 py-0.5">
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

            {/* Baseline Expected Curve */}
            {showBaseline && (
              <Line
                type="monotone"
                dataKey="baselineKw"
                name="Baseline Expected"
                stroke="#6B6864"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}

            {/* HVAC Cooling Load */}
            {showCooling && (
              <Area
                type="monotone"
                dataKey="coolingKw"
                name="Cooling (Chiller & AHU)"
                stroke="#C05621"
                strokeWidth={2}
                fill="url(#coolingGradient)"
              />
            )}

            {/* Gross Actual Power */}
            <Area
              type="monotone"
              dataKey="actualKw"
              name="Gross Active Power"
              stroke="#141413"
              strokeWidth={2.5}
              fill="url(#actualGradient)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Energy Telemetry Footer insight */}
      <div className="mt-3 pt-3 border-t border-[#F4F1EE] dark:border-[#2A2A28] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B6864] dark:text-[#A4A09B]">
        <div className="flex items-center gap-1.5">
          <Info className="size-3.5 text-[#C05621]" />
          <span>
            Current load {kpis.grossActivePowerKw} kW is {kpis.varianceDeltaKw > 0 ? "elevated" : "optimized"} due to Zone 04 overcooling. Executing the pending setback yields 3.5 kW peak reduction.
          </span>
        </div>
        <div className="font-mono text-[11px] text-[#141413] dark:text-[#F4F1EE]">
          Interval: 15-min Modbus Gateway Read
        </div>
      </div>
    </div>
  );
}
