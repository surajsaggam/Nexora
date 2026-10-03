"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Radio,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Users,
  Thermometer,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CaseStudyItem {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  background?: string;
  foreground?: string;
  badge?: string;
  metrics?: { label: string; value: string; hint?: string }[];
  visualType: "sense" | "predict" | "gate" | "verify";
}

export interface CaseStudyFlipStackProps {
  items: CaseStudyItem[];
  className?: string;
  onExploreAction?: () => void;
}

export function CaseStudyFlipStack({
  items,
  className,
  onExploreAction,
}: CaseStudyFlipStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const currentItem = items[activeIndex];

  const handleNext = () => {
    if (activeIndex === items.length - 1 && onExploreAction) {
      onExploreAction();
    }
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <div className={cn("w-full max-w-6xl mx-auto flex flex-col", className)}>
      {/* Top Step Selector Pill Bar */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {items.map((item, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 border cursor-pointer",
                  isSelected
                    ? "bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] border-[#141413] dark:border-[#F4F1EE] shadow-sm"
                    : "bg-white dark:bg-[#1D1D1B] text-[#6B6864] dark:text-[#A4A09B] border-[#E0DBD4] dark:border-[#333330] hover:border-[#141413] dark:hover:border-[#F4F1EE]"
                )}
              >
                <span className="font-mono text-[10px] opacity-70">0{idx + 1}</span>
                <span>{item.eyebrow}</span>
              </button>
            );
          })}
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrev}
            aria-label="Previous step"
            className="size-9 rounded-full bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] flex items-center justify-center text-[#141413] dark:text-[#F4F1EE] hover:bg-[#FAF8F5] dark:hover:bg-[#242422] transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next step"
            className="size-9 rounded-full bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] flex items-center justify-center text-[#141413] dark:text-[#F4F1EE] hover:bg-[#FAF8F5] dark:hover:bg-[#242422] transition-colors cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Flip Card Stack */}
      <div className="relative min-h-[460px] w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{
              type: "spring",
              damping: 24,
              stiffness: 260,
            }}
            className="w-full bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-6 sm:p-10 shadow-sm"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Editorial Story Copy */}
              <div className="lg:col-span-6 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#C05621]" />
                  <span className="text-xs uppercase font-bold tracking-widest text-[#C05621] font-mono">
                    Phase 0{activeIndex + 1} &bull; {currentItem.eyebrow}
                  </span>
                  {currentItem.badge && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] text-[#6B6864] dark:text-[#A4A09B]">
                      {currentItem.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-4xl font-semibold tracking-[-0.02em] text-[#141413] dark:text-[#F4F1EE] leading-tight">
                  {currentItem.title}
                </h3>

                <p className="text-base sm:text-lg text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
                  {currentItem.description}
                </p>

                {/* Quantitative Metric Badges */}
                {currentItem.metrics && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {currentItem.metrics.map((metric, i) => (
                      <div
                        key={i}
                        className="bg-[#FAF8F5] dark:bg-[#242422] p-3.5 rounded-2xl border border-[#E0DBD4] dark:border-[#333330]"
                      >
                        <div className="text-[11px] font-semibold text-[#6B6864] dark:text-[#A4A09B]">
                          {metric.label}
                        </div>
                        <div className="text-xl font-bold font-mono text-[#141413] dark:text-[#F4F1EE] mt-0.5">
                          {metric.value}
                        </div>
                        {metric.hint && (
                          <div className="text-[10px] text-[#8C8883] dark:text-[#777470] mt-0.5">
                            {metric.hint}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress / Next Action */}
                <div className="pt-4 flex items-center gap-3">
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>
                      {activeIndex === items.length - 1
                        ? "Restart Journey"
                        : `Next: ${items[(activeIndex + 1) % items.length].eyebrow}`}
                    </span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Clean Diagram / UI Treatment */}
              <div className="lg:col-span-6 bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-5 sm:p-6">
                {renderDiagram(currentItem.visualType)}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function renderDiagram(type: CaseStudyItem["visualType"]) {
  switch (type) {
    case "sense":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DBD4] dark:border-[#333330]">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-[#C05621]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#F4F1EE]">
                Zone 04 Sensor Stream (Suite B)
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#15803D] bg-[#15803D]/10 px-2 py-0.5 rounded-full font-bold">
              ● SIMULATED SENSOR FEED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#1D1D1B] p-3.5 rounded-xl border border-[#E0DBD4] dark:border-[#333330]">
              <div className="flex items-center gap-1.5 text-xs text-[#6B6864] dark:text-[#A4A09B]">
                <Users className="size-3.5 text-[#C05621]" />
                <span>PIR / Optical Count</span>
              </div>
              <div className="text-2xl font-bold font-mono text-[#C05621] mt-1">
                0 <span className="text-xs font-sans text-[#6B6864]">/ 18 cap</span>
              </div>
              <div className="text-[10px] text-[#C05621] mt-0.5">Vacated 42m early</div>
            </div>

            <div className="bg-white dark:bg-[#1D1D1B] p-3.5 rounded-xl border border-[#E0DBD4] dark:border-[#333330]">
              <div className="flex items-center gap-1.5 text-xs text-[#6B6864] dark:text-[#A4A09B]">
                <Thermometer className="size-3.5 text-[#1E3A8A]" />
                <span>Indoor Temp</span>
              </div>
              <div className="text-2xl font-bold font-mono text-[#141413] dark:text-[#F4F1EE] mt-1">
                21.2°C
              </div>
              <div className="text-[10px] text-[#6B6864]">Setpoint: 21.0°C (Over-cooled)</div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1D1D1B] p-3.5 rounded-xl border border-[#C05621]/40 bg-[#C05621]/[0.02]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[#141413] dark:text-[#F4F1EE] flex items-center gap-1.5">
                <Zap className="size-3.5 text-[#C05621]" /> Active HVAC Draw
              </span>
              <span className="font-mono font-bold text-[#C05621]">4.8 kW (Excess)</span>
            </div>
            <div className="w-full bg-[#E0DBD4] dark:bg-[#333330] h-2 rounded-full overflow-hidden">
              <div className="bg-[#C05621] h-full w-[80%] rounded-full" />
            </div>
            <div className="text-[10px] text-[#6B6864] dark:text-[#A4A09B] mt-1.5">
              Room is unoccupied, but chiller valve is operating at 80% throttle.
            </div>
          </div>
        </div>
      );

    case "predict":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DBD4] dark:border-[#333330]">
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-[#1E3A8A]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#F4F1EE]">
                Thermal &amp; Occupancy Forecast
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#1E3A8A] bg-[#1E3A8A]/10 px-2 py-0.5 rounded-full font-bold">
              94.6% CONFIDENCE
            </span>
          </div>

          <div className="bg-white dark:bg-[#1D1D1B] p-4 rounded-xl border border-[#E0DBD4] dark:border-[#333330] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6B6864] dark:text-[#A4A09B]">Vacancy Duration Ahead:</span>
              <span className="font-bold text-[#141413] dark:text-[#F4F1EE] font-mono">
                78 minutes (Until 15:30 reservation)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6B6864] dark:text-[#A4A09B]">Thermal Drift Rate:</span>
              <span className="font-bold text-[#15803D] font-mono">+0.5°C per 30 min (Slow rise)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6B6864] dark:text-[#A4A09B]">Predicted Room Temp at 15:30:</span>
              <span className="font-bold text-[#141413] dark:text-[#F4F1EE] font-mono">
                23.4°C (&lt; 25.5°C limit)
              </span>
            </div>
          </div>

          <div className="bg-[#FAF8F5] dark:bg-[#1D1D1B] p-3 rounded-xl border border-[#1E3A8A]/30 text-xs text-[#1E3A8A] flex items-center gap-2">
            <Clock className="size-4 shrink-0" />
            <span>Optimal action: Raise cooling setpoint to 24.5°C for the next 75 minutes.</span>
          </div>
        </div>
      );

    case "gate":
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E0DBD4] dark:border-[#333330]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#15803D]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#F4F1EE]">
                Safety Check &bull; 5/5 PASSED
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#15803D] bg-[#15803D]/10 px-2 py-0.5 rounded-full font-bold">
              SAFE TO ACT
            </span>
          </div>

          {[
            { name: "Comfort Temperature", val: "23.4°C predicted", limit: "Max 25.5°C" },
            { name: "Indoor Air Quality (IAQ)", val: "440 ppm CO₂", limit: "Max 950 ppm" },
            { name: "Compressor Protection", val: "54m elapsed", limit: "Min 15m anti-cycle" },
            { name: "Operating Policies", val: "Meeting room", limit: "No VIP locks active" },
            { name: "Confidence Gate", val: "94.6% match", limit: "Min 85.0% threshold" },
          ].map((check, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#1D1D1B] p-2.5 rounded-xl border border-[#E0DBD4] dark:border-[#333330] flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-[#15803D]" />
                <span className="font-semibold text-[#141413] dark:text-[#F4F1EE]">{check.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-[#141413] dark:text-[#F4F1EE] font-bold">{check.val}</span>
                <span className="text-[#8C8883]">({check.limit})</span>
              </div>
            </div>
          ))}
        </div>
      );

    case "verify":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DBD4] dark:border-[#333330]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[#15803D]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#F4F1EE]">
                Closed-Loop Verification
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#15803D] bg-[#15803D]/10 px-2 py-0.5 rounded-full font-bold">
              IPMVP OPTION C (SIMULATED)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white dark:bg-[#1D1D1B] p-3 rounded-xl border border-[#E0DBD4] dark:border-[#333330]">
              <div className="text-[10px] uppercase font-bold text-[#6B6864]">Before</div>
              <div className="text-lg font-bold font-mono text-[#141413] dark:text-[#F4F1EE] mt-1">
                5.6 kW
              </div>
              <div className="text-[9px] text-[#6B6864]">Baseline load</div>
            </div>

            <div className="bg-white dark:bg-[#1D1D1B] p-3 rounded-xl border border-[#E0DBD4] dark:border-[#333330]">
              <div className="text-[10px] uppercase font-bold text-[#C05621]">Action</div>
              <div className="text-lg font-bold font-mono text-[#C05621] mt-1">
                24.5°C
              </div>
              <div className="text-[9px] text-[#C05621]">Setback dispatched</div>
            </div>

            <div className="bg-white dark:bg-[#1D1D1B] p-3 rounded-xl border border-[#15803D]/30 bg-[#15803D]/[0.05]">
              <div className="text-[10px] uppercase font-bold text-[#15803D]">After</div>
              <div className="text-lg font-bold font-mono text-[#15803D] mt-1">
                1.8 kW
              </div>
              <div className="text-[9px] text-[#15803D]">Steady state</div>
            </div>
          </div>

          <div className="bg-[#15803D]/10 border border-[#15803D]/30 p-3.5 rounded-xl flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-[#15803D]">Verified Energy Reduction</div>
              <div className="text-[11px] text-[#15803D]/80">Zero occupant comfort complaints</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold font-mono text-[#15803D]">-3.8 kW</div>
              <div className="text-[10px] font-mono text-[#15803D]">₹342 saved / cycle</div>
            </div>
          </div>
        </div>
      );
  }
}
