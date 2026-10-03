"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Radio,
  Cpu,
  Sparkles,
  Sliders,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { CircuitBoard, CircuitNode, CircuitConnection } from "@/components/ui/circuit-board";

const CIRCUIT_NODES: CircuitNode[] = [
  {
    id: "sense",
    x: 65,
    y: 120,
    label: "Sense",
    subtitle: "Live Sensors",
    icon: <Radio className="size-4" />,
    description:
      "Reads power meters, PIR motion detectors, temperature sensors, and CO₂ air monitors every 15 minutes over existing BACnet & Modbus.",
  },
  {
    id: "understand",
    x: 185,
    y: 75,
    label: "Understand",
    subtitle: "Baseline Model",
    icon: <Cpu className="size-4" />,
    description:
      "Learns real building usage patterns and dynamic thermal characteristics without needing manual re-calibration.",
  },
  {
    id: "predict",
    x: 310,
    y: 165,
    label: "Predict",
    subtitle: "Demand Forecast",
    icon: <Sparkles className="size-4" />,
    description:
      "Forecasts vacancy duration and thermal drift 60 to 90 minutes ahead before energy is wasted cooling empty rooms.",
  },
  {
    id: "decide",
    x: 435,
    y: 75,
    label: "Decide",
    subtitle: "Optimal Action",
    icon: <Sliders className="size-4" />,
    description:
      "Calculates the precise setpoint adjustment (e.g. 21.0°C → 24.5°C) that saves the most energy while preserving indoor comfort.",
  },
  {
    id: "gate",
    x: 560,
    y: 165,
    label: "Safety Gate",
    subtitle: "5 Guardrails",
    icon: <ShieldCheck className="size-4" />,
    description:
      "Guarantees that comfort, fresh air ventilation, compressor anti-cycling, and room policies are 100% satisfied before taking action.",
  },
  {
    id: "act",
    x: 685,
    y: 75,
    label: "Act",
    subtitle: "BMS Dispatch",
    icon: <Zap className="size-4" />,
    description:
      "Dispatches standard BACnet commands seamlessly. Supports full automation or 1-click human-in-the-loop approval.",
  },
  {
    id: "verify",
    x: 810,
    y: 120,
    label: "Verify",
    subtitle: "Meter Readback",
    icon: <CheckCircle2 className="size-4" />,
    description:
      "Measures post-action power readings at the meter to prove actual kilowatt and rupee savings under IPMVP Option C standards.",
  },
];

const CIRCUIT_CONNECTIONS: CircuitConnection[] = [
  { from: "sense", to: "understand", animated: true },
  { from: "understand", to: "predict", animated: true },
  { from: "predict", to: "decide", animated: true },
  { from: "decide", to: "gate", animated: true },
  { from: "gate", to: "act", animated: true },
  { from: "act", to: "verify", animated: true },
];

export function LoopSection() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("sense");

  return (
    <section id="intelligence-flow" className="py-20 sm:py-28 border-t border-[#E0DBD4] dark:border-[#333330]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading — Editorial & Spacious */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="size-2 rounded-full bg-[#C05621]" />
            <span className="text-xs uppercase font-bold tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
              Intelligence Architecture
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-[#141413] dark:text-[#F4F1EE] mb-4">
            How NEXORA turns signals into verified savings.
          </h2>
          <p className="text-base sm:text-lg text-[#6B6864] dark:text-[#A4A09B] leading-relaxed">
            NEXORA does not replace your building or its existing BMS. It acts as an intelligence and verification layer across seven interconnected stages. Click any node to inspect.
          </p>
        </div>

        {/* Componentry CircuitBoard Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }}
          className="bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-6 sm:p-10 shadow-sm"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#E0DBD4] dark:border-[#333330] mb-6 text-xs text-[#6B6864] dark:text-[#A4A09B]">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#15803D] animate-pulse" />
              <span className="font-semibold text-[#141413] dark:text-[#F4F1EE]">Continuous Closed Loop</span>
            </div>
            <span className="font-mono text-[11px] hidden sm:inline">
              SENSE → UNDERSTAND → PREDICT → DECIDE → GATE → ACT → VERIFY
            </span>
          </div>

          <CircuitBoard
            nodes={CIRCUIT_NODES}
            connections={CIRCUIT_CONNECTIONS}
            width={880}
            height={230}
            activeNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </motion.div>
      </div>
    </section>
  );
}
