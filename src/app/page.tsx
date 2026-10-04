"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { HeroSection } from "@/components/sections/hero-section";
import { LoopSection } from "@/components/sections/loop-section";
import { SplitStorySection } from "@/components/sections/split-story-section";
import { CaseStudySection } from "@/components/sections/case-study-section";
import { EnergySection } from "@/components/sections/energy-section";
import { RecommendationSection } from "@/components/sections/recommendation-section";
import { SafetyGateSection } from "@/components/sections/safety-gate-section";
import { VerificationSection } from "@/components/sections/verification-section";
import { ControlSummarySection } from "@/components/sections/control-summary-section";
import { ZoneInspectionModal } from "@/components/zones/zone-inspection-modal";
import { ManualOverrideDrawer } from "@/components/controls/manual-override-drawer";
import { WhatIfEvaluatorModal } from "@/components/digital-twin/what-if-evaluator";
import { GeometricBackground } from "@/components/ui/hero-geometric";
import { useNexora } from "@/hooks/use-nexora";
import { ZoneData } from "@/types/nexora";

export default function Home() {
  const { zones } = useNexora();
  const [selectedZoneForOverride, setSelectedZoneForOverride] = useState<ZoneData | null>(null);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#F4F1EE] dark:bg-[#141413] text-[#141413] dark:text-[#F4F1EE] flex flex-col font-sans selection:bg-[#C05621]/20 selection:text-[#C05621] overflow-x-clip">
      {/* 1. Page-level persistent geometric background at z-0 inside visible stacking context */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <GeometricBackground
          color1="#e0e4d3"
          color2="#fdfffa"
          speed={0.8}
        />
      </div>

      {/* 2. Main Page Content at z-10 */}
      <div className="relative z-10 flex-1 w-full flex flex-col">
        {/* Stadium Navigation Header (Scrolls naturally with page) */}
        <Header
          onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
          onOpenZones={() => setIsZoneModalOpen(true)}
        />

        {/* Main Editorial Story Flow */}
        <main className="flex-1 w-full flex flex-col">
          {/* Section 1: Hero — NEXORA + core message + one strong building visual */}
          <HeroSection onExploreZones={() => setIsZoneModalOpen(true)} />

          {/* Section 2: Intelligence loop — SENSE → UNDERSTAND → PREDICT → DECIDE → GATE → ACT → VERIFY */}
          <LoopSection />

          {/* Section 3: Componentry Scroll Split Card — Architecture of the Closed Loop */}
          <SplitStorySection />

          {/* Section 4: Scrolling Case-Study FlipStack — SENSE → PREDICT → GATE → VERIFY */}
          <CaseStudySection />

          {/* Section 5: Building/energy story — large visual/chart with minimal supporting text */}
          <EnergySection onInspectZones={() => setIsZoneModalOpen(true)} />

          {/* Section 6: AI recommendation — focused interactive recommendation experience */}
          <RecommendationSection />

          {/* Section 7: Safety gate — explain WHY an action is safe */}
          <SafetyGateSection />

          {/* Section 8: Verification — show before → action → after → verified impact */}
          <VerificationSection />

          {/* Section 9: Final CTA / building control summary */}
          <ControlSummarySection
            onOpenOverride={() => {
              // Default to zone with anomaly or first zone
              const target = zones.find((z) => z.hasActiveAnomaly) || zones[0];
              setSelectedZoneForOverride(target);
            }}
            onOpenZones={() => setIsZoneModalOpen(true)}
            onOpenWhatIf={() => setIsScenarioModalOpen(true)}
          />
        </main>
      </div>

      {/* Progressive Disclosure: 8-Zone Deep Inspection Modal */}
      <ZoneInspectionModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        onSelectZoneForOverride={(zone) => {
          setIsZoneModalOpen(false);
          setSelectedZoneForOverride(zone);
        }}
      />

      {/* Facility Manager Manual Override Drawer */}
      <ManualOverrideDrawer
        zone={selectedZoneForOverride}
        onClose={() => setSelectedZoneForOverride(null)}
      />

      {/* Digital Twin What-If Evaluator Modal */}
      <WhatIfEvaluatorModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
      />
    </div>
  );
}
