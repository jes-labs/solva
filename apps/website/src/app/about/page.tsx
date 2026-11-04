import type { Metadata } from "next";
import { Close } from "@/components/layout/close";
import { PageOpening } from "@/components/layout/page-opening";
import { SealInstrument } from "@/components/ui/seal-instrument";
import { routes } from "@/config/navigation";
import { AboutFacts, AboutOrigin, AboutPrinciples } from "@/features/company";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Solva exists, the four rules its record keeps, and where it stands today: open source, on Stellar Testnet, with its security audit still ahead.",
  alternates: { canonical: routes.about },
};

const DAYS = Array.from({ length: 48 }, (_, i) => ![9, 23, 37].includes(i));

export default function AboutPage() {
  return (
    <>
      <PageOpening
        label="About"
        title="Built so the record means something."
        lead="Solva is an open registry on Stellar where anchors and custodial apps prove that their reserves cover what they owe, built to publish a record every day. This page says why it exists, how it is run, and where it stands today."
        primary={{ label: "What a record proves", href: routes.trust }}
        secondary={{ label: "Talk to us", href: routes.contact }}
        figure={
          <SealInstrument
            mode="calendar"
            days={DAYS}
            today={DAYS.length - 1}
            title="A calendar of daily records drawn on the Seal: three missed days shown hollow"
            className="mx-auto w-64 sm:w-80"
          >
            <span className="seal-value font-display num">45/48</span>
            <span className="mt-2 text-small text-sec">days recorded</span>
          </SealInstrument>
        }
        provenance={["Example calendar", "Hollow ticks are missed days"]}
      />
      <AboutOrigin />
      <AboutPrinciples />
      <AboutFacts />
      <Close />
    </>
  );
}
