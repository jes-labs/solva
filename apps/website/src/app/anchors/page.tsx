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
    "Show holders and partners that your Stellar token is backed. Each proof is checked by a contract on Stellar and free for anyone to read. Covered, short and stale statuses are coming soon.",
  alternates: { canonical: routes.anchors },
};

const contactHref = `${routes.contact}?role=Anchor`;

export default async function AnchorsPage() {
  const snapshot = await readSupplySnapshot();
  return (
    <>
      <PageOpening
        label="For anchors"
        title="Show that your token is backed."
        lead="Your token supply is already public on Stellar. Solva proves your reserves cover what you owe, a contract on Stellar checks every proof, and each holder can confirm their own balance was counted."
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
