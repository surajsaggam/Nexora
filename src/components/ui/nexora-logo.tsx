"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface NexoraLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "mark" | "full";
  accentDot?: boolean;
}

export function NexoraLogo({
  className,
  size = "md",
  variant = "full",
  accentDot = true,
}: NexoraLogoProps) {
  const sizeMap = {
    sm: { box: "size-7", svg: 18, text: "text-sm", sub: "text-[9px]" },
    md: { box: "size-9", svg: 22, text: "text-base", sub: "text-[10px]" },
    lg: { box: "size-11", svg: 26, text: "text-lg", sub: "text-xs" },
    xl: { box: "size-14", svg: 32, text: "text-2xl", sub: "text-sm" },
  };

  const currentSize = sizeMap[size];

  // Geometric NX Symbol — closed-loop architectural signals
  const MarkSVG = (
    <div
      className={cn(
        currentSize.box,
        "rounded-2xl bg-[#141413] dark:bg-[#F4F1EE] flex items-center justify-center relative shadow-sm shrink-0 transition-transform hover:scale-105"
      )}
    >
      <svg
        width={currentSize.svg}
        height={currentSize.svg}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[#F4F1EE] dark:text-[#141413]"
      >
        {/* N Pillar & Diagonal Vector */}
        <path
          d="M7 23V9L16 23V9"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X Interlocking Signal Vector */}
        <path
          d="M19 11L27 23M27 11L19 23"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Closed-loop Intelligence Signal Nexus */}
        {accentDot && (
          <circle
            cx="27.5"
            cy="9.5"
            r="2"
            className="fill-[#C05621] stroke-[#141413] dark:stroke-[#F4F1EE] stroke-1"
          />
        )}
      </svg>
    </div>
  );

  if (variant === "mark") {
    return <div className={cn("inline-flex items-center", className)}>{MarkSVG}</div>;
  }

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      {MarkSVG}
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-semibold tracking-[-0.03em] text-[#141413] dark:text-[#F4F1EE]",
            currentSize.text
          )}
        >
          NEXORA
        </span>
        <span
          className={cn(
            "font-mono font-medium uppercase tracking-wider text-[#6B6864] dark:text-[#A4A09B] mt-0.5",
            currentSize.sub
          )}
        >
          Building Intelligence
        </span>
      </div>
    </div>
  );
}
