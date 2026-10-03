"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Cpu, Zap, ShieldCheck, Play, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LOOP_STEPS = [
  {
    id: "SENSE",
    number: "01",
    label: "Sense",
    tagline: "Listen to the building in real time",
    icon: Radio,
    description:
      "NEXORA reads data from your existing electric meters, PIR motion detectors, temperature probes, and CO₂ air quality sensors every 15 minutes over standard BACnet and Modbus.",
    details: [
      "No rip-and-replace — integrates directly with existing BMS",
      "Validates noisy sensor streams and flags sensor failures",
      "Measures real occupant density rather than static schedules",
    ],
    metric: "8/8 Zones Online",
  },
  {
    id: "PREDICT",
    number: "02",
    label: "Predict",
    tagline: "Anticipate demand before energy is wasted",
    icon: Cpu,
    description:
      "Conventional thermostats only react after a room is hot or empty. NEXORA builds a dynamic thermal baseline for each room and forecasts vacancy duration 70 minutes ahead.",
    details: [
      "XGBoost room vacancy prediction calibrated to 90-day history",
      "Thermal inertia model predicts how slow the room warms up",
      "Calculates peak demand penalty risks hours in advance",
    ],
    metric: "94.6% Confidence",
  },
  {
    id: "DECIDE",
    number: "03",
    label: "Decide",
    tagline: "Calculate the optimal control action",
    icon: Zap,
    description:
      "The decision engine evaluates possible actions: setpoint setback, ventilation modulation, or daylight dimming. It selects the change that saves the most energy while preserving comfort.",
    details: [
      "Balances electricity savings with thermal comfort",
      "Selects optimal setpoints (e.g. 21°C → 24.5°C when empty)",
      "Reduces lighting ballast load by up to 85% during vacancy",
    ],
    metric: "3.5 kW Peak Reduction",
  },
  {
    id: "GATE",
    number: "04",
    label: "Gate",
    tagline: "Five safety guardrails before anything moves",
    icon: ShieldCheck,
    description:
      "NEXORA never allows AI unconstrained control. Every action must pass 5 formal checks: comfort temperature, indoor air quality, compressor anti-cycling, executive rules, and model confidence.",
    details: [
      "Comfort boundary: Room temp cannot exceed 25.5°C",
      "IAQ boundary: CO₂ must remain strictly below 950 ppm",
      "Equipment protection: Prevents chiller short-cycling",
    ],
    metric: "5/5 Checks Passed",
  },
  {
    id: "ACT",
    number: "05",
    label: "Act",
    tagline: "Human-in-the-loop or pre-authorized automation",
    icon: Play,
    description:
      "Depending on the facility manager's selected policy (Monitor, Recommend, Approve, or Automate), the command is either presented for one-click approval or dispatched automatically.",
    details: [
      "Facility manager maintains 1-click manual override at all times",
      "Dispatches standard BACnet Analog Output setpoint commands",
      "Complete cryptographic audit trail of every control action",
    ],
    metric: "1-Click Dispatch",
  },
  {
    id: "VERIFY",
    number: "06",
    label: "Verify",
    tagline: "Prove the savings with real meter telemetry",
    icon: CheckCircle2,
    description:
      "We never merely claim that an action worked. NEXORA reads back the smart meter 30 minutes after execution, verifies the kW drop against the baseline, and confirms comfort was preserved.",
    details: [
      "Complies with IPMVP Option C whole-building M&V protocol",
      "Verifies real thermal stability and air quality after change",
      "Feeds measured results back into the model to learn and improve",
    ],
    metric: "IPMVP Compliant",
  },
];

export function LoopSection() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = LOOP_STEPS[activeStepIndex];
  const Icon = activeStep.icon;

  return (
    <section className="py-16 sm:py-24 border-t border-[#E0DBD4] dark:border-[#333330]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="size-2 rounded-full bg-[#15803D]" />
            <span className="text-xs uppercase font-bold tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
              The Intelligence Loop
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-[#141413] dark:text-[#F4F1EE] mb-4">
            How NEXORA turns signals into verified savings.
          </h2>
          <p className="text-base sm:text-lg text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
            Conventional building systems stop at monitoring. NEXORA closes the loop: SENSE → PREDICT → DECIDE → GATE → ACT → VERIFY.
          </p>
        </div>

        {/* 6 Step Horizontal Pills / Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {LOOP_STEPS.map((step, idx) => {
            const isSelected = idx === activeStepIndex;
            const StepIcon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStepIndex(idx)}
                className={cn(
                  "px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 btn-press flex items-center gap-2 border",
                  isSelected
                    ? "bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] border-[#141413] dark:border-[#F4F1EE] shadow-sm"
                    : "bg-white dark:bg-[#1D1D1B] text-[#6B6864] dark:text-[#A4A09B] border-[#E0DBD4] dark:border-[#333330] hover:border-[#141413] dark:hover:border-[#F4F1EE]"
                )}
              >
                <span className="font-mono text-[10px] opacity-70">{step.number}</span>
                <StepIcon className="size-3.5" />
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Step Display Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
            className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-6 sm:p-10 shadow-sm"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Stage Details */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center gap-2 text-xs text-[#C05621] font-mono font-bold uppercase">
                  <span>Step {activeStep.number} of 06</span>
                  <span>•</span>
                  <span>{activeStep.tagline}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#141413] dark:text-[#F4F1EE]">
                  {activeStep.label}: {activeStep.tagline}
                </h3>

                <p className="text-base text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
                  {activeStep.description}
                </p>

                <div className="pt-3 space-y-2">
                  {activeStep.details.map((point, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-[#141413] dark:text-[#F4F1EE]">
                      <span className="size-1.5 rounded-full bg-[#15803D]" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Stage Visual Pill Card */}
              <div className="lg:col-span-4 bg-[#FAF8F5] dark:bg-[#242422] border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-6 text-center flex flex-col items-center justify-center">
                <div className="size-16 rounded-full bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] flex items-center justify-center mb-4 shadow-sm">
                  <Icon className="size-7 text-[#C05621]" />
                </div>
                <div className="text-xs uppercase font-bold tracking-wider text-[#6B6864] dark:text-[#A4A09B] mb-1">
                  Active Metric
                </div>
                <div className="text-2xl font-bold tracking-tight text-[#141413] dark:text-[#F4F1EE] mb-4">
                  {activeStep.metric}
                </div>
                <button
                  onClick={() => setActiveStepIndex((prev) => (prev + 1) % LOOP_STEPS.length)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold border border-[#E0DBD4] dark:border-[#333330] hover:bg-[#EAE6E1] dark:hover:bg-[#2A2A28] text-[#141413] dark:text-[#F4F1EE] transition-colors btn-press flex items-center gap-1.5"
                >
                  <span>Next: {LOOP_STEPS[(activeStepIndex + 1) % LOOP_STEPS.length].label}</span>
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
