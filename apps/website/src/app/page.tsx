import type { Metadata } from "next";
import { ParticleHero } from "@/components/home/particle-hero";
import { Hero } from "@/components/home/hero";
import { Pipeline } from "@/components/home/pipeline";
import {
  InstitutionsSection,
  Problem,
  Differentiators,
  AudienceGrid,
  MarginSection,
  Developers,
  SecurityOracle,
  StatsBand,
  HomeFaq,
  FinalCta,
} from "@/components/home/sections";

export const metadata: Metadata = {
  description:
    "Solva continuously proves your reserves meet or exceed your liabilities, verified on-chain on Stellar, without revealing any customer balance.",
};

export default function HomePage() {
  return (
    <>
      <ParticleHero />
      {/* Opaque layer above the pinned hero. As it scrolls up it overlays the
          receding particle hero, which is the parallax handoff. */}
      <div className="relative z-10 bg-bg">
        <Hero />
        <InstitutionsSection />
        <Problem />
        <Pipeline />
        <Differentiators />
        <AudienceGrid />
        <MarginSection />
        <Developers />
        <SecurityOracle />
        <StatsBand />
        <HomeFaq />
        <FinalCta />
      </div>
    </>
  );
}
