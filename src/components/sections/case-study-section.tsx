"use client";

import React from "react";
import { CaseStudyFlipStack, CaseStudyItem } from "@/components/ui/case-study-flip-stack";

const CASE_STUDY_ITEMS: CaseStudyItem[] = [
  {
    id: "sense",
    eyebrow: "SENSE",
    title: "NEXORA sees the building change.",
    description:
      "Occupancy falls. The meeting ends 42 minutes early, but the building is still cooling an empty conference suite at full capacity.",
    badge: "Zone 04 • Suite B",
    visualType: "sense",
    metrics: [
      { label: "Active Occupancy", value: "0 / 18", hint: "Room vacated early" },
      { label: "Wasted Cooling", value: "4.8 kW", hint: "80% chiller throttle" },
    ],
  },
  {
    id: "predict",
    eyebrow: "PREDICT",
    title: "It predicts the next hour.",
    description:
      "Occupancy and energy models identify the opportunity before waste continues, verifying that no reservation is scheduled for the next 78 minutes.",
    badge: "ML Forecast Engine",
    visualType: "predict",
    metrics: [
      { label: "Forecasted Vacancy", value: "78 mins", hint: "Until 15:30 reservation" },
      { label: "Confidence", value: "94.6%", hint: "Friday pattern match" },
    ],
  },
  {
    id: "gate",
    eyebrow: "GATE",
    title: "Every action passes a safety check.",
    description:
      "Comfort, IAQ, equipment limits and operating rules are checked before action. If even one check fails, the action is blocked.",
    badge: "5/5 Checks Passed",
    visualType: "gate",
    metrics: [
      { label: "Target Setback", value: "24.5°C", hint: "Comfort limit: 25.5°C" },
      { label: "Fresh Air IAQ", value: "440 ppm", hint: "Safe threshold: 950 ppm" },
    ],
  },
  {
    id: "verify",
    eyebrow: "VERIFY",
    title: "Then NEXORA proves the result.",
    description:
      "Before, action, after and verified impact — all in one closed loop. Smart meters confirm real kilowatt drop and zero comfort violations.",
    badge: "IPMVP Option C",
    visualType: "verify",
    metrics: [
      { label: "Verified Drop", value: "-3.8 kW", hint: "Continuous reduction" },
      { label: "Cost Saved", value: "₹342", hint: "Single meeting cycle" },
    ],
  },
];

export function CaseStudySection() {
  return (
    <section id="case-study" className="py-20 sm:py-28 border-t border-[#E0DBD4] dark:border-[#333330]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="size-2 rounded-full bg-[#15803D]" />
            <span className="text-xs uppercase font-bold tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
              A Live Scenario Walkthrough
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-[#141413] dark:text-[#F4F1EE] mb-4">
            How a single empty room saves ₹342 per cycle.
          </h2>
          <p className="text-base sm:text-lg text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
            Follow the real-world sequence in Floor 4 Conference Suite B: from instant occupancy drop, to safety verification, to real kilowatt meter readback.
          </p>
        </div>

        {/* Componentry CaseStudyFlipStack */}
        <CaseStudyFlipStack items={CASE_STUDY_ITEMS} />
      </div>
    </section>
  );
}
