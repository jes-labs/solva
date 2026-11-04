import type { Metadata } from "next";
import { Close } from "@/components/layout/close";
import { PageOpening } from "@/components/layout/page-opening";
import { routes } from "@/config/navigation";
import {
  AnchorAssetPage,
  AnchorControl,
  AnchorCost,
  AnchorFaq,
  AnchorReaders,
  AnchorSupply,
} from "@/features/solutions";
import { readSupplySnapshot } from "@/lib/stellar-supply";

export const metadata: Metadata = {
  title: "For anchors",
  description:
    "Show holders and partners that your Stellar token is backed, every day. Solva records each asset as covered, short or stale, free for anyone to read.",
  alternates: { canonical: routes.anchors },
};

const contactHref = `${routes.contact}?role=Anchor`;

export default async function AnchorsPage() {
  const snapshot = await readSupplySnapshot();
  return (
    <>
      <PageOpening
        label="For anchors"
        title="Show your token is backed, every day."
        lead="Your token supply is already public on Stellar. Connect your reserves, and every day Solva records whether they cover it, on a page your holders can check for themselves."
        primary={{ label: "Talk to us", href: contactHref }}
        secondary={{ label: "See it work", href: routes.demo }}
        figure={<AnchorAssetPage />}
      />
      <AnchorSupply snapshot={snapshot} />
      <AnchorReaders />
      <AnchorControl />
      <AnchorCost />
      <AnchorFaq />
      <Close
        institutions={{
          label: "For anchors",
          title: "Put your reserves on the record.",
          body: "Tell us which token you issue and we will plan a pilot around it, from the first reserve account to the first public record.",
          action: { label: "Talk to us", href: contactHref },
        }}
      />
    </>
  );
}
