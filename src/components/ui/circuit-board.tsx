"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CircuitNode {
  id: string;
  x: number;
  y: number;
  label: string;
  subtitle?: string;
  description?: string;
  icon: React.ReactNode;
  status?: "active" | "ready" | "normal";
}

export interface CircuitConnection {
  from: string;
  to: string;
  animated?: boolean;
  color?: string;
}

export interface CircuitBoardProps {
  nodes: CircuitNode[];
  connections: CircuitConnection[];
  width?: number;
  height?: number;
  className?: string;
  activeNodeId?: string;
  onSelectNode?: (nodeId: string) => void;
}

export function CircuitBoard({
  nodes,
  connections,
  width = 880,
  height = 240,
  className,
  activeNodeId,
  onSelectNode,
}: CircuitBoardProps) {
  const [internalActiveId, setInternalActiveId] = useState<string>(
    activeNodeId || nodes[0]?.id || ""
  );

  const currentActiveId = activeNodeId !== undefined ? activeNodeId : internalActiveId;

  const handleNodeClick = (id: string) => {
    if (onSelectNode) {
      onSelectNode(id);
    } else {
      setInternalActiveId(id);
    }
  };

  const nodeMap = new Map<string, CircuitNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  return (
    <div className={cn("w-full relative flex flex-col items-center", className)}>
      {/* Circuit Board SVG canvas */}
      <div className="w-full overflow-x-auto overflow-y-hidden py-4 no-scrollbar">
        <div className="min-w-[700px] w-full max-w-[920px] mx-auto relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto drop-shadow-sm select-none"
            style={{ maxHeight: height + 40 }}
          >
            <defs>
              {/* Subtle grid pattern background */}
              <pattern
                id="circuit-grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="0.75" fill="#E0DBD4" opacity="0.4" />
              </pattern>

              {/* Glowing signal pulse gradient */}
              <linearGradient id="signalPulse" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C05621" stopOpacity="0" />
                <stop offset="50%" stopColor="#C05621" stopOpacity="1" />
                <stop offset="100%" stopColor="#C05621" stopOpacity="0" />
              </linearGradient>

              {/* Active connection pulse */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Subtle background circuit trace grid */}
            <rect
              x="0"
              y="0"
              width={width}
              height={height}
              fill="url(#circuit-grid)"
              className="opacity-40"
            />

            {/* Circuit connections */}
            {connections.map((conn, idx) => {
              const fromNode = nodeMap.get(conn.from);
              const toNode = nodeMap.get(conn.to);
              if (!fromNode || !toNode) return null;

              // Generate an orthogonal / curved bus circuit path
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const midX = fromNode.x + dx * 0.5;

              // Smooth right-angle routing with fillets
              const pathD =
                Math.abs(dy) < 5
                  ? `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`
                  : `M ${fromNode.x} ${fromNode.y} C ${midX} ${fromNode.y}, ${midX} ${toNode.y}, ${toNode.x} ${toNode.y}`;

              const isConnectedToActive =
                conn.from === currentActiveId || conn.to === currentActiveId;

              return (
                <g key={`conn-${idx}`}>
                  {/* Background track line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isConnectedToActive ? "#C05621" : "#D5CFCA"}
                    strokeWidth={isConnectedToActive ? 2.5 : 1.5}
                    strokeOpacity={isConnectedToActive ? 0.8 : 0.6}
                    strokeLinecap="round"
                    className="transition-colors duration-300"
                  />

                  {/* Animated pulse dot moving along the circuit trace */}
                  {conn.animated !== false && (
                    <circle r={3} fill="#C05621" filter="url(#glow)">
                      <animateMotion
                        path={pathD}
                        dur="3.2s"
                        repeatCount="indefinite"
                        begin={`${idx * 0.45}s`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Circuit nodes */}
            {nodes.map((node) => {
              const isActive = node.id === currentActiveId;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => handleNodeClick(node.id)}
                  className="cursor-pointer group"
                >
                  {/* Outer halo on active */}
                  {isActive && (
                    <circle
                      r="28"
                      fill="none"
                      stroke="#C05621"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      className="animate-spin-slow opacity-60"
                    />
                  )}

                  {/* Node Pad Base */}
                  <circle
                    r="22"
                    fill={isActive ? "#141413" : "#FAF8F5"}
                    stroke={isActive ? "#C05621" : "#D5CFCA"}
                    strokeWidth={isActive ? 2 : 1.5}
                    className="transition-all duration-300 group-hover:stroke-[#141413] shadow-sm"
                  />

                  {/* Node icon rendered inside foreignObject */}
                  <foreignObject
                    x="-14"
                    y="-14"
                    width="28"
                    height="28"
                    className="pointer-events-none"
                  >
                    <div
                      className={cn(
                        "w-full h-full flex items-center justify-center transition-colors duration-300",
                        isActive
                          ? "text-[#F4F1EE]"
                          : "text-[#6B6864] group-hover:text-[#141413]"
                      )}
                    >
                      {node.icon}
                    </div>
                  </foreignObject>

                  {/* Node Label underneath */}
                  <text
                    x="0"
                    y="36"
                    textAnchor="middle"
                    className={cn(
                      "text-[11px] font-sans font-semibold tracking-tight transition-colors duration-300 pointer-events-none select-none",
                      isActive
                        ? "fill-[#141413] dark:fill-[#F4F1EE] font-bold"
                        : "fill-[#6B6864] dark:fill-[#A4A09B]"
                    )}
                  >
                    {node.label}
                  </text>

                  {/* Node Subtitle */}
                  {node.subtitle && (
                    <text
                      x="0"
                      y="48"
                      textAnchor="middle"
                      className="text-[9px] font-mono fill-[#8C8883] dark:fill-[#777470] pointer-events-none select-none"
                    >
                      {node.subtitle}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Node Details Box (Progressive Disclosure) */}
      {(() => {
        const activeNode = nodeMap.get(currentActiveId) || nodes[0];
        if (!activeNode || !activeNode.description) return null;

        return (
          <motion.div
            key={activeNode.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-2xl mt-4 px-6 py-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] flex items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-[#C05621]" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-[#F4F1EE]">
                  {activeNode.label}
                </span>
                <p className="text-xs text-[#6B6864] dark:text-[#A4A09B] mt-0.5">
                  {activeNode.description}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#8C8883] shrink-0 uppercase">
              Phase {nodes.findIndex((n) => n.id === activeNode.id) + 1} of {nodes.length}
            </span>
          </motion.div>
        );
      })()}
    </div>
  );
}
