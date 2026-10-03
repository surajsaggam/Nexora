"use client";

import React from "react";
import Image from "next/image";
import { useNexora } from "@/hooks/use-nexora";
import { Zap, Building2, ShieldCheck, ArrowRight, ArrowDown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { HeroGeometric } from "@/components/ui/hero-geometric";

export function HeroSection({
  onExploreZones,
}: {
  onExploreZones: () => void;
}) {
  const { kpis, currentTime } = useNexora();

  const scrollToStory = () => {
    const el = document.getElementById("intelligence-flow") || document.getElementById("case-study");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full flex flex-col">
      <HeroGeometric
        title1="Buildings"
        title2="That Think."
        description="NEXORA adds an intelligence layer to existing buildings — sensing demand, predicting waste, acting safely, and verifying the result."
        badge="Retrofit-First Building Intelligence"
      >
        {/* Primary & Secondary Pill CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.2, 0, 0, 1] }}
          className="flex flex-wrap items-center gap-3.5 mb-14"
        >
          <button
            onClick={scrollToStory}
            className="h-12 px-7 rounded-full text-sm font-semibold bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>See How It Works</span>
            <ArrowDown className="size-4" />
          </button>

          <button
            onClick={onExploreZones}
            className="h-12 px-7 rounded-full text-sm font-semibold bg-white dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] text-[#141413] dark:text-[#F4F1EE] hover:bg-[#FAF8F5] dark:hover:bg-[#242422] transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>Inspect 8 Zones</span>
            <ArrowRight className="size-4 text-[#C05621]" />
          </button>
        </motion.div>

        {/* 4 Meaningful, Unclipped Metric Cards (Active Power, Monitored Area, Comfort/IAQ, Current Opportunity) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.2, 0, 0, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
        >
          {/* Metric 1: Active Power */}
          <div className="bg-white/90 dark:bg-[#1D1D1B]/90 backdrop-blur-md border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6864] dark:text-[#A4A09B]">
                Active Power
              </span>
              <div className="size-7 rounded-full bg-[#C05621]/10 flex items-center justify-center text-[#C05621]">
                <Zap className="size-3.5" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono tracking-tight text-[#141413] dark:text-[#F4F1EE] mb-1">
              {kpis.grossActivePowerKw} <span className="text-sm font-sans font-normal text-[#6B6864]">kW</span>
            </div>
            <div className="text-xs text-[#6B6864] dark:text-[#A4A09B] font-mono">
              Expected baseline: {kpis.baselineExpectedKw} kW
            </div>
          </div>

          {/* Metric 2: Monitored Area */}
          <div className="bg-white/90 dark:bg-[#1D1D1B]/90 backdrop-blur-md border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6864] dark:text-[#A4A09B]">
                Monitored Area
              </span>
              <div className="size-7 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center text-[#1E3A8A]">
                <Building2 className="size-3.5" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#141413] dark:text-[#F4F1EE] mb-1">
              1,000 <span className="text-sm font-sans font-normal text-[#6B6864]">m²</span>
            </div>
            <div className="text-xs text-[#6B6864] dark:text-[#A4A09B]">
              Apex Horizon &bull; Floor 4 (8 Zones)
            </div>
          </div>

          {/* Metric 3: Comfort / IAQ */}
          <div className="bg-white/90 dark:bg-[#1D1D1B]/90 backdrop-blur-md border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6864] dark:text-[#A4A09B]">
                Comfort &amp; IAQ
              </span>
              <div className="size-7 rounded-full bg-[#15803D]/10 flex items-center justify-center text-[#15803D]">
                <ShieldCheck className="size-3.5" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono tracking-tight text-[#15803D] mb-1">
              {kpis.comfortCompliancePercent}%
            </div>
            <div className="text-xs text-[#6B6864] dark:text-[#A4A09B]">
              Zero safety boundary violations
            </div>
          </div>

          {/* Metric 4: Current Opportunity */}
          <div className="bg-white/90 dark:bg-[#1D1D1B]/90 backdrop-blur-md border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C05621]">
                Current Opportunity
              </span>
              <div className="size-7 rounded-full bg-[#C05621]/10 flex items-center justify-center text-[#C05621]">
                <Sparkles className="size-3.5" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono tracking-tight text-[#C05621] mb-1">
              -3.8 <span className="text-sm font-sans font-normal">kW</span>
            </div>
            <div className="text-xs text-[#6B6864] dark:text-[#A4A09B]">
              Suite B vacated 42m early
            </div>
          </div>
        </motion.div>
      </HeroGeometric>

      {/* Stadium Architectural Media Frame (Mastercard 40px radius gesture) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6 mb-16 sm:mb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
          className="relative rounded-[32px] sm:rounded-[40px] overflow-hidden border border-[#E0DBD4] dark:border-[#333330] shadow-[0_16px_48px_-12px_rgba(20,20,19,0.12)] bg-[#141413]"
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
              <span className="font-semibold tracking-tight">Apex Horizon Complex &bull; Floor 4</span>
              <span className="text-[#6B6864] dark:text-[#A4A09B] hidden sm:inline">&bull; 8 Zones Instrumented</span>
              <span className="text-[#C05621] font-mono font-medium">&bull; {currentTime} IST</span>
            </div>

            {/* Bottom-right interactive trigger */}
            <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8">
              <button
                onClick={onExploreZones}
                className="bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413] px-5 py-2.5 rounded-full text-xs font-bold tracking-tight shadow-md hover:opacity-90 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Inspect 8 Zones</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
