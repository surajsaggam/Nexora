"use client";

import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform, useMotionTemplate } from "framer-motion";
import { useRef } from "react";

export interface ScrollSplitCardItem {
  title: string;
  description: string;
  bgColor: string;
  textColor: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface ScrollSplitCardProps {
  className?: string;
  imageSrc: string;
  cards: ScrollSplitCardItem[];
  containerRef?: React.RefObject<HTMLElement | null>;
  startText?: string;
  endingText?: string;
}

export function ScrollSplitCard({
  className,
  imageSrc,
  cards,
  containerRef: externalContainerRef,
  startText = "Scroll to explore intelligence architecture",
  endingText = "Sense • Predict • Gate • Verify",
}: ScrollSplitCardProps) {
  const localContainerRef = useRef<HTMLDivElement>(null);
  const targetRef = externalContainerRef || localContainerRef;

  const { scrollYProgress } = useScroll({
    target: targetRef as React.RefObject<HTMLElement>,
    offset: ["start start", "end end"],
  });

  // Stage 1 to 2: Separation (0 to 0.4), then Stage 2 to 3: Overlap closer (0.4 to 0.8)
  const leftX = useTransform(scrollYProgress, [0, 0.4, 0.8], [0, -42, -20]);
  const rightX = useTransform(scrollYProgress, [0, 0.4, 0.8], [0, 42, 20]);
  const scale = useTransform(scrollYProgress, [0, 0.4], [1, 0.94]);

  // Stage 2 to 3: Flip (0.4 to 0.8)
  const rotateY = useTransform(scrollYProgress, [0.4, 0.8], [0, 180]);
  // Due to 180deg Y flip, positive Z becomes visual counter-clockwise, negative Z becomes visual clockwise
  const rotateZLeft = useTransform(scrollYProgress, [0.4, 0.8], [0, 5]);
  const rotateZRight = useTransform(scrollYProgress, [0.4, 0.8], [0, -5]);

  // Dynamic borders/radii so it looks like ONE unified building facade initially
  const borderRadiusLeft = useTransform(scrollYProgress, [0, 0.25], ["24px 0px 0px 24px", "24px 24px 24px 24px"]);
  const borderRadiusMiddle = useTransform(scrollYProgress, [0, 0.25], ["0px 0px 0px 0px", "24px 24px 24px 24px"]);
  const borderRadiusRight = useTransform(scrollYProgress, [0, 0.25], ["0px 24px 24px 0px", "24px 24px 24px 24px"]);
  const borderOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 0.2]);
  const shadowOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 0.35]);
  const boxShadow = useMotionTemplate`inset 0 1px 1px rgba(255, 255, 255, ${borderOpacity}), inset 0 -24px 48px rgba(0, 0, 0, ${shadowOpacity}), 0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity})`;

  // Cards move up slightly in the final phase
  const cardsY = useTransform(scrollYProgress, [0.8, 1], [0, -30]);

  // Text appearance at the end in the sticky viewport
  const textOpacity = useTransform(scrollYProgress, [0.75, 0.95], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.75, 0.95], [20, 0]);

  // Indicator text appearance at the start
  const startTextOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const startTextY = useTransform(scrollYProgress, [0, 0.15], [0, -15]);

  return (
    <div
      ref={localContainerRef}
      className={cn("relative h-[220vh] w-full", className)}
    >
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden [perspective:1200px] px-4">
        {/* Starting Text Indicator */}
        <motion.div
          className="absolute top-[12%] sm:top-[14%] left-0 right-0 text-center px-4 pointer-events-none"
          style={{
            opacity: startTextOpacity,
            y: startTextY,
          }}
        >
          <span className="text-[11px] font-mono font-bold tracking-widest text-[#C05621] uppercase">
            Closed-Loop Platform
          </span>
          <p className="text-sm font-semibold tracking-wide text-[#6B6864] dark:text-[#A4A09B] mt-1">
            {startText}
          </p>
        </motion.div>

        {/* 3D Split Card Container */}
        <motion.div
          style={{ scale, y: cardsY, transformStyle: "preserve-3d" }}
          className="flex h-[380px] sm:h-[440px] w-full max-w-5xl px-2 sm:px-4 relative items-center justify-center"
        >
          {cards.slice(0, 3).map((card, i) => (
            <motion.div
              key={i}
              className="relative h-full flex-1"
              style={{
                x: i === 0 ? leftX : i === 2 ? rightX : 0,
                rotateY,
                rotateZ: i === 0 ? rotateZLeft : i === 2 ? rotateZRight : 0,
                zIndex: i,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Front Side: Original Architectural Building Facade Split */}
              <motion.div
                className="absolute inset-0 overflow-hidden [backface-visibility:hidden] border border-[#E0DBD4] dark:border-[#333330]"
                style={{
                  zIndex: 2,
                  borderRadius: i === 0 ? borderRadiusLeft : i === 2 ? borderRadiusRight : borderRadiusMiddle,
                  boxShadow,
                }}
              >
                <div
                  className="absolute inset-0 h-full w-[300%]"
                  style={{
                    left: `${-100 * i}%`,
                    backgroundImage: `url(${imageSrc})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                {/* Subtle photographic contrast tint */}
                <div className="absolute inset-0 bg-black/15" />
              </motion.div>

              {/* Back Side: NEXORA Intelligence Content Card */}
              <motion.div
                className={cn(
                  "absolute inset-0 overflow-hidden flex flex-col justify-between p-6 sm:p-8 [backface-visibility:hidden] will-change-transform",
                  "border border-[#E0DBD4]/40 dark:border-[#333330]"
                )}
                style={{
                  backgroundColor: card.bgColor,
                  color: card.textColor,
                  transform: "rotateY(180deg)",
                  zIndex: 1,
                  borderRadius: i === 0 ? borderRadiusLeft : i === 2 ? borderRadiusRight : borderRadiusMiddle,
                  boxShadow,
                }}
              >
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-white/10 dark:bg-black/20 flex items-center justify-center backdrop-blur-sm border border-white/15">
                    {card.icon}
                  </div>
                  {card.badge && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 border border-white/20">
                      {card.badge}
                    </span>
                  )}
                </div>

                {/* Card Editorial Copy */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2.5">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed opacity-85">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Ending Text in Sticky Viewport */}
        <motion.div
          className="absolute bottom-[10%] sm:bottom-[12%] left-0 right-0 text-center px-4 pointer-events-none"
          style={{
            opacity: textOpacity,
            y: textY,
          }}
        >
          <p className="text-sm sm:text-base font-semibold tracking-tight text-[#141413] dark:text-[#F4F1EE]">
            {endingText}
          </p>
          <p className="text-xs font-mono text-[#6B6864] dark:text-[#A4A09B] mt-1">
            IPMVP Option C &bull; Continuous Building Verification
          </p>
        </motion.div>
      </div>
    </div>
  );
}
