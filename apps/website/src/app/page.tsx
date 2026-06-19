import type { Metadata } from "next";
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
    </>
  );
}
