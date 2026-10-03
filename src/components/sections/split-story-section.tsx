"use client";

import React from "react";
import { ScrollSplitCard, ScrollSplitCardItem } from "@/components/ui/scroll-split-card";
import { Radio, Cpu, ShieldCheck } from "lucide-react";

const SPLIT_CARDS: ScrollSplitCardItem[] = [
  {
    title: "SENSE & UNDERSTAND",
    description:
      "Continuous telemetry captures occupancy changes, IAQ shifts, and sub-metered power drift across existing building infrastructure.",
    bgColor: "#1D1D1B",
    textColor: "#F4F1EE",
    badge: "Live Telemetry",
    icon: <Radio className="size-5 text-[#C05621]" />,
  },
  {
    title: "PREDICT & DECIDE",
    description:
      "Digital-twin thermal physics simulate the next 45 minutes to evaluate setback actions before spaces are scheduled for re-occupancy.",
    bgColor: "#C05621",
    textColor: "#FFFFFF",
    badge: "Digital Twin",
    icon: <Cpu className="size-5 text-white" />,
  },
  {
    title: "GATE & VERIFY",
    description:
      "Five independent safety guardrails gate every action, followed by rigorous IPMVP Option C measurement and verification.",
    bgColor: "#141413",
    textColor: "#FFFFFF",
    badge: "Safety Enforced",
    icon: <ShieldCheck className="size-5 text-[#22C55E]" />,
  },
];

export function SplitStorySection() {
  return (
    <section id="split-story" className="relative w-full border-t border-[#E0DBD4] dark:border-[#333330]">
      {/* Editorial Section Intro Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="size-2 rounded-full bg-[#C05621]" />
            <span className="text-xs uppercase font-bold tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
              Intelligence Architecture
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-[#141413] dark:text-[#F4F1EE] mb-4">
            How intelligence moves through the building.
          </h2>
          <p className="text-base sm:text-lg text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
            NEXORA connects directly to existing sensors and BMS equipment. Every control action is simulated, safety-gated, and verified before permanent adoption.
          </p>
        </div>
      </div>

      {/* Componentry Scroll Split Card Interactive Viewport */}
      <ScrollSplitCard
        imageSrc="/split_building.jpg"
        cards={SPLIT_CARDS}
        startText="Scroll down to expand closed-loop phases"
        endingText="Continuous Closed-Loop Optimization"
      />
    </section>
  );
}
