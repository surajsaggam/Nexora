"use client";

import React, { useState } from "react";
import { CheckCircle2, Zap, TrendingDown, Clock, Scale } from "lucide-react";
import { useNexora } from "@/hooks/use-nexora";

export function VerificationSection() {
  const { verifications } = useNexora();
  const [selectedVerId, setSelectedVerId] = useState<string>(verifications[0]?.id || "ver-001");

  const activeRecord = verifications.find((v) => v.id === selectedVerId) || verifications[0];

  return (
    <section id="verification" className="py-20 sm:py-28 border-t border-[#E0DBD4] dark:border-[#333330]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="size-2 rounded-full bg-[#15803D]" />
            <span className="text-xs uppercase font-bold tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
              Verified Impact
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-[#141413] dark:text-[#F4F1EE] mb-4">
            Verified impact. Never assumed.
          </h2>
          <p className="text-base sm:text-lg text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
            NEXORA does not just report estimated savings. Following international energy measurement protocols (IPMVP), every action is verified against before-and-after meter readings to demonstrate genuine kilowatt and cost reductions.
          </p>
        </div>

        {/* 4-Step Before → Action → After → Verified Impact Journey */}
        {activeRecord && (
          <div className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-6 sm:p-10 shadow-sm mb-10 card-hover-lift">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E0DBD4] dark:border-[#333330]">
              <div>
                <span className="text-xs font-semibold text-[#6B6864] dark:text-[#A4A09B] uppercase tracking-wider">
                  Verified Case Study
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#141413] dark:text-[#F4F1EE]">
                  {activeRecord.zoneName}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#15803D]/10 text-[#15803D] flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" /> M&V VERIFIED
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] text-[#6B6864] dark:text-[#A4A09B]">
                  {activeRecord.evidence}
                </span>
              </div>
            </div>

            {/* 4 sequential step cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 relative">
              {/* Step 1: Before */}
              <div className="bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#6B6864] dark:text-[#A4A09B] uppercase">
                      1. Before
                    </span>
                    <Clock className="size-4 text-[#6B6864] dark:text-[#A4A09B]" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-[#141413] dark:text-[#F4F1EE] mb-1">
                    {activeRecord.beforePowerKw.toFixed(1)} <span className="text-sm font-sans font-normal text-[#6B6864] dark:text-[#A4A09B]">kW</span>
                  </div>
                  <div className="text-xs text-[#6B6864] dark:text-[#A4A09B]">
                    Initial baseline load
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E0DBD4] dark:border-[#333330] text-xs font-mono text-[#6B6864] dark:text-[#A4A09B]">
                  Temp: {activeRecord.tempBefore.toFixed(1)}°C &bull; CO₂: {activeRecord.co2Before} ppm
                </div>
              </div>

              {/* Step 2: Action */}
              <div className="bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#C05621] uppercase">
                      2. Action
                    </span>
                    <Zap className="size-4 text-[#C05621]" />
                  </div>
                  <div className="text-base font-bold text-[#141413] dark:text-[#F4F1EE] mb-1">
                    Setback Dispatched
                  </div>
                  <div className="text-xs text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
                    Automated BACnet damper shift & lighting ramp down
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E0DBD4] dark:border-[#333330] text-xs font-mono text-[#6B6864] dark:text-[#A4A09B]">
                  Executed at {activeRecord.executedAt}
                </div>
              </div>

              {/* Step 3: After */}
              <div className="bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#6B6864] dark:text-[#A4A09B] uppercase">
                      3. After
                    </span>
                    <TrendingDown className="size-4 text-[#15803D]" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-[#141413] dark:text-[#F4F1EE] mb-1">
                    {activeRecord.actualPowerKw.toFixed(1)} <span className="text-sm font-sans font-normal text-[#6B6864] dark:text-[#A4A09B]">kW</span>
                  </div>
                  <div className="text-xs text-[#6B6864] dark:text-[#A4A09B]">
                    New steady-state power
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E0DBD4] dark:border-[#333330] text-xs font-mono text-[#6B6864] dark:text-[#A4A09B]">
                  Temp: {activeRecord.tempAfter.toFixed(1)}°C &bull; CO₂: {activeRecord.co2After} ppm
                </div>
              </div>

              {/* Step 4: Verified Impact */}
              <div className="bg-[#15803D]/10 border border-[#15803D]/30 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#15803D] uppercase">
                      4. Verified Impact
                    </span>
                    <CheckCircle2 className="size-4 text-[#15803D]" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-[#15803D] mb-1">
                    -{activeRecord.measuredReductionKw.toFixed(1)} <span className="text-sm font-sans font-normal">kW</span>
                  </div>
                  <div className="text-xs font-medium text-[#15803D]">
                    ₹{activeRecord.costSavedInr} saved &bull; 0 comfort issues
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#15803D]/20 text-xs font-mono text-[#15803D]">
                  Verified at {activeRecord.verifiedAt}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification History Selector / Protocol Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-6 sm:p-7 shadow-sm">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#6B6864] dark:text-[#A4A09B] mb-4">
              Recent Verification Log (Today)
            </h4>
            <div className="space-y-3">
              {verifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedVerId(item.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    selectedVerId === item.id
                      ? "border-[#141413] dark:border-[#F4F1EE] bg-[#FAF8F5] dark:bg-[#242422]"
                      : "border-[#E0DBD4] dark:border-[#333330] hover:border-[#6B6864] dark:hover:border-[#A4A09B]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-[#15803D]/10 text-[#15803D] flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#141413] dark:text-[#F4F1EE]">
                        {item.zoneName}
                      </div>
                      <div className="text-xs text-[#6B6864] dark:text-[#A4A09B]">
                        Executed {item.executedAt} &bull; Verified {item.verifiedAt}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-[#15803D]">
                      -{item.measuredReductionKw.toFixed(1)} kW
                    </div>
                    <div className="text-xs font-mono text-[#6B6864] dark:text-[#A4A09B]">
                      ₹{item.costSavedInr} saved
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Standards & Transparency card */}
          <div className="bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-full bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] flex items-center justify-center text-[#141413] dark:text-[#F4F1EE] mb-4">
                <Scale className="size-5 text-[#C05621]" />
              </div>
              <h4 className="text-base font-bold text-[#141413] dark:text-[#F4F1EE] mb-2">
                Measurement & Verification (M&V)
              </h4>
              <p className="text-xs sm:text-sm text-[#6B6864] dark:text-[#A4A09B] leading-relaxed mb-4">
                Every optimization outcome adheres to the <strong>IPMVP Option C (Whole Facility)</strong> and <strong>ASHRAE Guideline 14</strong> protocols.
              </p>
              <ul className="text-xs text-[#6B6864] dark:text-[#A4A09B] space-y-2">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[#15803D]" />
                  Weather and occupancy normalized baselines
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[#15803D]" />
                  Sub-meter telemetry readback within 60 minutes
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[#15803D]" />
                  Clear audit trail for utility rebates and ESG reports
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[#E0DBD4] dark:border-[#333330] text-xs font-mono text-[#6B6864] dark:text-[#A4A09B] flex items-center justify-between">
              <span>Standard: IPMVP-2022</span>
              <span className="font-semibold text-[#15803D]">Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
