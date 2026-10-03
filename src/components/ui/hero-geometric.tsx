"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeroGeometricProps {
  title1?: string;
  title2?: string;
  description?: string;
  badge?: string;
  color1?: string;
  color2?: string;
  className?: string;
  children?: React.ReactNode;
}

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-[#C05621]/15 to-transparent",
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -50,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{
          y: [0, 12, 0],
          rotate: [0, 2, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width,
          height,
        }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border border-[#C05621]/20 dark:border-[#C05621]/30",
            "shadow-[0_8px_32px_0_rgba(192,86,33,0.06)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}

export function HeroGeometric({
  title1 = "Buildings",
  title2 = "That Think.",
  description = "NEXORA adds an intelligence layer to existing buildings — sensing demand, predicting waste, acting safely, and verifying the result.",
  badge = "Retrofit-First Building Intelligence",
  color1 = "#C05621",
  color2 = "#E0DBD4",
  className,
  children,
}: HeroGeometricProps) {
  return (
    <div
      style={{ "--hero-color1": color1, "--hero-color2": color2 } as React.CSSProperties}
      className={cn(
        "relative min-h-[82vh] w-full flex flex-col justify-center overflow-hidden bg-[#F4F1EE] dark:bg-[#141413] transition-colors",
        className
      )}
    >
      {/* Background Subtle Floating Geometrics (Warm cream/orange palette) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <ElegantShape
          delay={0.1}
          width={600}
          height={140}
          rotate={12}
          gradient="from-[#C05621]/12 via-[#C05621]/5 to-transparent"
          className="left-[-10%] top-[15%] md:left-[-5%] md:top-[18%]"
        />

        <ElegantShape
          delay={0.3}
          width={480}
          height={120}
          rotate={-16}
          gradient="from-[#1E3A8A]/8 via-[#C05621]/6 to-transparent"
          className="right-[-8%] top-[25%] md:right-[-2%] md:top-[28%]"
        />

        <ElegantShape
          delay={0.5}
          width={320}
          height={90}
          rotate={-8}
          gradient="from-[#C05621]/10 to-transparent"
          className="left-[5%] bottom-[18%]"
        />

        <ElegantShape
          delay={0.6}
          width={240}
          height={80}
          rotate={22}
          gradient="from-[#6B6864]/10 to-transparent"
          className="right-[15%] bottom-[12%]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 sm:py-16 flex flex-col justify-center">
        {/* Eyebrow Badge */}
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.2, 0, 0, 1] }}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.2, 0, 0, 1] }}
            className="text-lg sm:text-2xl text-[#6B6864] dark:text-[#A4A09B] max-w-2xl font-normal leading-relaxed mb-10"
          >
            {description}
          </motion.p>
        )}

        {/* Custom children (e.g. CTA buttons, 4 unclipped metric pills) */}
        {children}
      </div>
    </div>
  );
}
