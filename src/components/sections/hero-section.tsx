"use client";

import React from "react";
import Image from "next/image";
import { useNexora } from "@/hooks/use-nexora";
import { Zap, Building2, ShieldCheck, Radio, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection({
  onExploreZones,
}: {
  onExploreZones: () => void;
}) {
  const { kpis, currentTime } = useNexora();

  return (
    <section className="relative pt-8 pb-16 sm:pt-14 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Eyebrow Label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="flex items-center gap-2 mb-4"
        >
          <span className="size-2 rounded-full bg-[#C05621]" />
          <span className="text-xs uppercase font-bold tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
            Retrofit-First Building Intelligence
          </span>
        </motion.div>

        {/* Large Editorial Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.2, 0, 0, 1] }}
          className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] leading-[1.05] text-[#141413] dark:text-[#F4F1EE] max-w-4xl mb-6"
        >
          Data alone doesn&apos;t save energy. <br className="hidden sm:inline" />
          <span className="text-[#C05621]">Decisions do.</span>
        </motion.h1>

        {/* Editorial Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.2, 0, 0, 1] }}
          className="text-lg sm:text-xl text-[#6B6864] dark:text-[#A4A09B] max-w-2xl leading-relaxed mb-10"
        >
          NEXORA acts as an intelligent decision and verification layer over existing building systems. It senses real occupant demand, predicts wasted cooling, and safely controls HVAC without replacing your building&apos;s existing BMS.
        </motion.p>

        {/* Spacious KPI Pill Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.2, 0, 0, 1] }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-12"
        >
          {/* Metric 1 */}
          <div className="bg-white/80 dark:bg-[#1D1D1B]/80 backdrop-blur-sm border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-[#6B6864] dark:text-[#A4A09B] font-medium mb-1">
              <Zap className="size-3.5 text-[#C05621]" />
              <span>Active Power</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413] dark:text-[#F4F1EE]">
              {kpis.grossActivePowerKw} <span className="text-xs font-normal text-[#6B6864]">kW</span>
            </div>
            <div className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] mt-1 font-mono">
              Baseline: {kpis.baselineExpectedKw} kW
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-white/80 dark:bg-[#1D1D1B]/80 backdrop-blur-sm border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-[#6B6864] dark:text-[#A4A09B] font-medium mb-1">
              <Building2 className="size-3.5 text-[#1E3A8A]" />
              <span>Monitored Area</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413] dark:text-[#F4F1EE]">
              1,000 <span className="text-xs font-normal text-[#6B6864]">m²</span>
            </div>
            <div className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] mt-1 font-mono">
              Floor 4 • 8 Active Zones
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-white/80 dark:bg-[#1D1D1B]/80 backdrop-blur-sm border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-[#6B6864] dark:text-[#A4A09B] font-medium mb-1">
              <ShieldCheck className="size-3.5 text-[#15803D]" />
              <span>Comfort Score</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#15803D]">
              {kpis.comfortCompliancePercent}%
            </div>
            <div className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] mt-1 font-mono">
              IAQ &amp; Thermal Compliance
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-white/80 dark:bg-[#1D1D1B]/80 backdrop-blur-sm border border-[#E0DBD4] dark:border-[#333330] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-[#6B6864] dark:text-[#A4A09B] font-medium mb-1">
              <Radio className="size-3.5 text-[#15803D]" />
              <span>Telemetry Ingest</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413] dark:text-[#F4F1EE]">
              Live <span className="text-xs font-normal text-[#15803D] font-mono">15m reads</span>
            </div>
            <div className="text-[11px] text-[#6B6864] dark:text-[#A4A09B] mt-1 font-mono">
              BACnet &amp; Modbus Gateway
            </div>
          </div>
        </motion.div>

        {/* Stadium Media Visual Frame (Mastercard 40px radius gesture) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.2, 0, 0, 1] }}
          className="relative rounded-[32px] sm:rounded-[40px] overflow-hidden border border-[#E0DBD4] dark:border-[#333330] shadow-[0_12px_40px_-12px_rgba(20,20,19,0.12)] bg-[#141413]"
        >
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full max-h-[460px]">
            <Image
              src="/hero_building.jpg"
              alt="Apex Horizon Commercial Complex"
              fill
              priority
              className="object-cover object-center"
            />
            {/* Subtle natural vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Bottom-left metadata badge */}
            <div className="absolute bottom-5 left-5 sm:bottom-8 sm:left-8 bg-white/90 dark:bg-[#1D1D1B]/90 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-full px-4 py-2 shadow-lg flex items-center gap-3 text-xs text-[#141413] dark:text-[#F4F1EE]">
              <span className="size-2 rounded-full bg-[#15803D] animate-pulse" />
              <span className="font-semibold tracking-tight">Apex Horizon Complex • Floor 4</span>
              <span className="text-[#6B6864] dark:text-[#A4A09B] hidden sm:inline">• 8 Zones Instrumented</span>
              <span className="text-[#C05621] font-mono font-medium">• {currentTime} IST</span>
            </div>

            {/* Bottom-right interactive trigger */}
            <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8">
              <button
                onClick={onExploreZones}
                className="bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] px-5 py-2.5 rounded-full text-xs font-bold tracking-tight shadow-md hover:opacity-90 transition-all btn-press flex items-center gap-2"
              >
                <span>Inspect 8 Zones</span>
                <ArrowDown className="size-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
