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

        {/* 4 Editorial Metric Cards — High Hierarchy, Generous Whitespace, No SaaS Clutter */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.2, 0, 0, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full"
        >
          {/* Metric 1: Active Power */}
          <div className="bg-white/95 dark:bg-[#1D1D1B]/95 backdrop-blur-md border border-[#E0DBD4] dark:border-[#333330] rounded-[28px] p-6 shadow-sm flex flex-col justify-between transition-all hover:border-[#141413]/30 dark:hover:border-[#F4F1EE]/30">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
                  Active Power
                </span>
                <div className="size-7 rounded-full bg-[#C05621]/10 flex items-center justify-center text-[#C05621]">
                  <Zap className="size-3.5" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] font-mono text-[#141413] dark:text-[#F4F1EE]">
                {kpis.grossActivePowerKw} <span className="text-sm font-sans font-normal text-[#6B6864]">kW</span>
              </div>
            </div>
            <div className="text-xs text-[#6B6864] dark:text-[#A4A09B] font-mono pt-3 mt-3 border-t border-[#E0DBD4]/60 dark:border-[#333330]/60">
              Expected baseline: {kpis.baselineExpectedKw} kW
            </div>
          </div>

          {/* Metric 2: Monitored Area */}
          <div className="bg-white/95 dark:bg-[#1D1D1B]/95 backdrop-blur-md border border-[#E0DBD4] dark:border-[#333330] rounded-[28px] p-6 shadow-sm flex flex-col justify-between transition-all hover:border-[#141413]/30 dark:hover:border-[#F4F1EE]/30">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
                  Monitored Area
                </span>
                <div className="size-7 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center text-[#1E3A8A]">
                  <Building2 className="size-3.5" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#141413] dark:text-[#F4F1EE]">
                1,000 <span className="text-sm font-sans font-normal text-[#6B6864]">m²</span>
              </div>
            </div>
            <div className="text-xs text-[#6B6864] dark:text-[#A4A09B] pt-3 mt-3 border-t border-[#E0DBD4]/60 dark:border-[#333330]/60">
              Apex Horizon &bull; Floor 4 (8 Zones)
            </div>
          </div>

          {/* Metric 3: Comfort & IAQ */}
          <div className="bg-white/95 dark:bg-[#1D1D1B]/95 backdrop-blur-md border border-[#E0DBD4] dark:border-[#333330] rounded-[28px] p-6 shadow-sm flex flex-col justify-between transition-all hover:border-[#141413]/30 dark:hover:border-[#F4F1EE]/30">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
                  Comfort &amp; IAQ
                </span>
                <div className="size-7 rounded-full bg-[#15803D]/10 flex items-center justify-center text-[#15803D]">
                  <ShieldCheck className="size-3.5" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] font-mono text-[#15803D]">
                {kpis.comfortCompliancePercent}%
              </div>
            </div>
            <div className="text-xs text-[#6B6864] dark:text-[#A4A09B] pt-3 mt-3 border-t border-[#E0DBD4]/60 dark:border-[#333330]/60">
              Zero safety boundary violations
            </div>
          </div>

          {/* Metric 4: Current Opportunity */}
          <div className="bg-white/95 dark:bg-[#1D1D1B]/95 backdrop-blur-md border border-[#C05621]/30 dark:border-[#C05621]/40 rounded-[28px] p-6 shadow-sm flex flex-col justify-between transition-all bg-[#C05621]/[0.02]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#C05621]">
                  Current Opportunity
                </span>
                <div className="size-7 rounded-full bg-[#C05621]/15 flex items-center justify-center text-[#C05621]">
                  <Sparkles className="size-3.5" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] font-mono text-[#C05621]">
                -3.8 <span className="text-sm font-sans font-normal">kW</span>
              </div>
            </div>
            <div className="text-xs text-[#6B6864] dark:text-[#A4A09B] pt-3 mt-3 border-t border-[#C05621]/20">
              Suite B vacated 42m early
            </div>
          </div>
        </motion.div>
      </HeroGeometric>

      {/* Narrative Stadium Building Visual Frame — Proportionate, Calm, Generous Whitespace */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8 mb-20 sm:mt-12 sm:mb-28">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.85, ease: [0.2, 0, 0, 1] }}
          className="relative rounded-[32px] sm:rounded-[40px] overflow-hidden border border-[#E0DBD4] dark:border-[#333330] shadow-[0_20px_50px_-16px_rgba(20,20,19,0.12)] bg-[#141413]"
        >
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full max-h-[420px]">
            <Image
              src="/hero_building.jpg"
              alt="Apex Horizon Commercial Complex"
              fill
              priority
              className="object-cover object-center"
            />
            {/* Subtle photographic vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

            {/* Bottom-left metadata badge with strict evidence disclosure */}
            <div className="absolute bottom-5 left-5 sm:bottom-7 sm:left-7 bg-white/95 dark:bg-[#1D1D1B]/95 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-full px-4 py-2 shadow-lg flex items-center gap-3 text-xs text-[#141413] dark:text-[#F4F1EE]">
              <span className="size-2 rounded-full bg-[#15803D] animate-pulse" />
              <span className="font-semibold tracking-tight">Apex Horizon Complex &bull; Floor 4</span>
              <span className="text-[#6B6864] dark:text-[#A4A09B] hidden sm:inline">&bull; 8 Zones Instrumented</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#2A2A28] text-[#6B6864] dark:text-[#A4A09B]">
                SIMULATED DATA
              </span>
              <span className="text-[#C05621] font-mono font-medium hidden md:inline">&bull; {currentTime} IST</span>
            </div>

            {/* Bottom-right interactive trigger */}
            <div className="absolute bottom-5 right-5 sm:bottom-7 sm:right-7">
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
