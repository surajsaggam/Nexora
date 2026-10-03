"use client";

import React from "react";
import { ShieldCheck, Thermometer, Wind, Wrench, FileCheck, CheckCircle2 } from "lucide-react";

export function SafetyGateSection() {
  const safetyChecks = [
    {
      title: "Comfort Protected",
      category: "Thermal Comfort",
      status: "24.5°C Target",
      limit: "Max 25.5°C limit",
      icon: Thermometer,
      description:
        "The room will drift slowly from 21.2°C to 23.4°C over 45 minutes. When the next meeting starts, it is already cool and comfortable.",
    },
    {
      title: "Fresh Air Guaranteed",
      category: "Indoor Air Quality",
      status: "440 ppm CO₂",
      limit: "Max 950 ppm limit",
      icon: Wind,
      description:
        "Ventilation dampers remain at minimum fresh-air opening. Even with reduced fan speeds, indoor air quality remains fresh and clean.",
    },
    {
      title: "Equipment Protected",
      category: "Compressor Health",
      status: "54m Elapsed",
      limit: "Min 15m anti-cycle",
      icon: Wrench,
      description:
        "Chiller compressors are strictly locked against rapid on/off cycling to prevent premature motor wear and maintain equipment warranty.",
    },
    {
      title: "Operating Rules Respected",
      category: "Room Policy",
      status: "Standard Meeting Suite",
      limit: "No executive lock",
      icon: FileCheck,
      description:
        "Non-critical meeting space. No executive override or VIP lock is active. The room schedule was checked before proposing any change.",
    },
    {
      title: "High Model Confidence",
      category: "Prediction Quality",
      status: "94.6% Match",
      limit: "Min 85.0% threshold",
      icon: ShieldCheck,
      description:
        "Trained on 90 days of room sensor history. The model verified that occupancy matches past Friday afternoon patterns with high certainty.",
    },
  ];

  return (
    <section id="safety-gate" className="py-16 sm:py-20 border-t border-[#E0DBD4] dark:border-[#333330]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-2xl mb-10 sm:mb-12">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="size-2 rounded-full bg-[#15803D]" />
            <span className="text-xs uppercase font-bold tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
              Safety Check
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-[-0.02em] text-[#141413] dark:text-[#F4F1EE] mb-3">
            Why this action is safe to run.
          </h2>
          <p className="text-sm sm:text-base text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
            NEXORA never allows energy savings to compromise occupant comfort or building health. Every proposed action must pass five independent safety guardrails before execution.
          </p>
        </div>

        {/* 5 Guardrail Cards Grid + 1 Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {safetyChecks.map((check, index) => {
            const Icon = check.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between card-hover-lift"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-8 rounded-full bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] flex items-center justify-center text-[#141413] dark:text-[#F4F1EE]">
                      <Icon className="size-4 text-[#C05621]" />
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#15803D] bg-[#15803D]/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="size-3" /> PASSED
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-[#6B6864] dark:text-[#A4A09B] mb-0.5">
                    {check.category}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#141413] dark:text-[#F4F1EE] mb-2">
                    {check.title}
                  </h3>
                  <p className="text-xs text-[#6B6864] dark:text-[#A4A09B] leading-relaxed mb-4">
                    {check.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#F4F1EE] dark:border-[#2A2A28] flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-[#141413] dark:text-[#F4F1EE]">{check.status}</span>
                  <span className="text-[#6B6864] dark:text-[#A4A09B]">{check.limit}</span>
                </div>
              </div>
            );
          })}

          {/* 6th Card: Summary Callout */}
          <div className="bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between card-hover-lift">
            <div>
              <div className="size-8 rounded-full bg-[#15803D] text-white flex items-center justify-center mb-3 shadow-sm">
                <ShieldCheck className="size-4" />
              </div>
              <div className="text-[11px] font-semibold text-[#15803D] uppercase tracking-wider mb-0.5">
                Zero Comfort Violations
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#141413] dark:text-[#F4F1EE] mb-2">
                Built for Building Operators
              </h3>
              <p className="text-xs text-[#6B6864] dark:text-[#A4A09B] leading-relaxed mb-4">
                If even one condition fails — such as sudden room occupancy or temperature drift — the action is immediately blocked or rolled back to baseline.
              </p>
            </div>

            <div className="pt-2.5 border-t border-[#E0DBD4] dark:border-[#333330] text-[10px] font-mono text-[#6B6864] dark:text-[#A4A09B]">
              Safety Check Engine &bull; Real-Time Guardrails
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
