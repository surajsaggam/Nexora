"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  moveX = [0, 25, -15, 0],
  moveY = [0, -35, 15, 0],
  moveRotate = [0, 4, -3, 0],
  duration = 6.5,
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
  moveX?: number[];
  moveY?: number[];
  moveRotate?: number[];
  duration?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: shouldReduceMotion ? 0 : -30,
        rotate: shouldReduceMotion ? rotate : rotate - 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: shouldReduceMotion ? 0.6 : 1.6,
        delay,
        ease: [0.2, 0, 0, 1],
        opacity: { duration: 1.0 },
      }}
      className={cn("absolute transform-gpu will-change-transform", className)}
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: moveX,
                y: moveY,
                rotate: moveRotate,
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
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
            "shadow-[0_8px_32px_0_rgba(192,86,33,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]"
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
      {/* Background Continuous Floating Geometrics with Depth and Asynchronous Loops */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Shape 1: Hero Anchor — Upper-left foreground */}
        <ElegantShape
          delay={0.1}
          width={620}
          height={140}
          rotate={12}
          gradient="from-[#C05621]/15 via-[#C05621]/7 to-transparent"
          moveX={[0, 32, -18, 0]}
          moveY={[0, -44, 20, 0]}
          moveRotate={[0, 4.5, -3.5, 0]}
          duration={6.8}
          className="left-[-8%] top-[14%] md:left-[-4%] md:top-[16%]"
        />

        {/* Shape 2: Deep Counter-Balance — Upper-right midground */}
        <ElegantShape
          delay={0.2}
          width={520}
          height={125}
          rotate={-16}
          gradient="from-[#1E3A8A]/10 via-[#C05621]/8 to-transparent"
          moveX={[0, -36, 20, 0]}
          moveY={[0, 38, -22, 0]}
          moveRotate={[0, -5, 3.5, 0]}
          duration={6.2}
          className="right-[-8%] top-[24%] md:right-[-3%] md:top-[26%]"
        />

        {/* Shape 3: Midground Floater — Lower-left */}
        <ElegantShape
          delay={0.3}
          width={340}
          height={95}
          rotate={-8}
          gradient="from-[#C05621]/14 via-[#D97706]/8 to-transparent"
          moveX={[0, 26, -24, 0]}
          moveY={[0, 32, -36, 0]}
          moveRotate={[0, -4, 4.5, 0]}
          duration={5.6}
          className="left-[4%] bottom-[16%] md:left-[6%] md:bottom-[20%]"
        />

        {/* Shape 4: Crisp Foreground Accent — Lower-right */}
        <ElegantShape
          delay={0.4}
          width={280}
          height={85}
          rotate={22}
          gradient="from-[#8C8883]/14 via-[#C05621]/8 to-transparent"
          moveX={[0, -28, 22, 0]}
          moveY={[0, -36, 18, 0]}
          moveRotate={[0, 5, -3, 0]}
          duration={5.2}
          className="right-[12%] bottom-[10%] md:right-[16%] md:bottom-[14%]"
        />

        {/* Shape 5: Atmospheric Background Depth — Center-top */}
        <ElegantShape
          delay={0.5}
          width={440}
          height={110}
          rotate={-5}
          gradient="from-[#C05621]/8 via-[#E0DBD4]/12 to-transparent"
          moveX={[0, 20, -25, 0]}
          moveY={[0, -26, 30, 0]}
          moveRotate={[0, 3, -4, 0]}
          duration={7.6}
          className="left-[32%] top-[6%] md:left-[38%] md:top-[8%]"
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
