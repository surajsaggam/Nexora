"use client";

import React from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// Client-side dynamic import of Three.js shader canvas to prevent SSR hydration errors
const HeroGeometricCanvas = dynamic(
  () => import("./hero-geometric-canvas"),
  { ssr: false }
);

export interface GeometricBackgroundProps {
  color1?: string;
  color2?: string;
  speed?: number;
  intensity?: number;
  className?: string;
}

/**
 * Page-level persistent geometric background layer.
 * Stays fixed behind all content across the entire scrollable page.
 * Uses Componentry HeroGeometric Three.js shader with Bayer 4x4 dithering and simplex noise.
 */
export function GeometricBackground({
  color1 = "#e0e4d3",
  color2 = "#fdfffa",
  speed = 0.8,
  intensity = 0.35,
  className = "",
}: GeometricBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden",
        className
      )}
    >
      {/* 30-40% visual intensity for subtle architectural editorial depth */}
      <div
        className="w-full h-full dark:opacity-20 transition-opacity duration-300"
        style={{ opacity: intensity, width: "100%", height: "100%" }}
      >
        <HeroGeometricCanvas color1={color1} color2={color2} speed={speed} />
      </div>
    </div>
  );
}

export interface HeroGeometricProps {
  title1?: string;
  title2?: string;
  description?: string;
  badge?: string;
  color1?: string;
  color2?: string;
  speed?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Editorial Hero layout component following Componentry design specifications.
 */
export function HeroGeometric({
  title1 = "Buildings",
  title2 = "That Think.",
  description = "NEXORA adds an intelligence layer to existing buildings — sensing demand, predicting waste, acting safely, and verifying the result.",
  badge = "Retrofit-First Building Intelligence",
  color1 = "#e0e4d3",
  color2 = "#fdfffa",
  speed = 0.8,
  className,
  children,
}: HeroGeometricProps) {
  return (
    <div
      className={cn(
        "relative min-h-[78vh] w-full flex flex-col justify-center overflow-hidden transition-colors",
        className
      )}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 sm:py-16 flex flex-col justify-center">
        {/* Eyebrow Badge */}
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="size-2 rounded-full bg-[#C05621]" />
            <span className="text-xs uppercase font-bold tracking-widest text-[#6B6864] dark:text-[#A4A09B]">
              {badge}
            </span>
          </motion.div>
        )}

        {/* Large Editorial Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mb-6"
        >
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-semibold tracking-[-0.035em] leading-[1.0] text-[#141413] dark:text-[#F4F1EE]">
            <span>{title1}</span> <br className="hidden sm:inline" />
            <span className="text-[#C05621]">{title2}</span>
          </h1>
        </motion.div>

        {/* Editorial Subhead */}
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg sm:text-2xl text-[#6B6864] dark:text-[#A4A09B] max-w-2xl font-normal leading-relaxed mb-10"
          >
            {description}
          </motion.p>
        )}

        {/* Children (Action CTAs & Metric Cards) */}
        {children}
      </div>
    </div>
  );
}

export default HeroGeometric;
