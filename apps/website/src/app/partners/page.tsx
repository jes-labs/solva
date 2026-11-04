import type { Metadata } from "next";
import { Close } from "@/components/layout/close";
import { PageOpening } from "@/components/layout/page-opening";
import { routes } from "@/config/navigation";
import { site } from "@/config/site";
import {
  IsCoveredFigure,
  PartnerAlerts,
  PartnerAuditor,
  PartnerLending,
  PartnerVerdicts,
} from "@/features/solutions";

export const metadata: Metadata = {
  title: "For partners",
  description:
    "Wallets, lending pools and auditors read the verified totals behind a Stellar asset for free, with the ledger they were checked at. Covered, short and stale verdicts are coming soon.",
  alternates: { canonical: routes.partners },
};

const contactHref = `${routes.contact}?role=Partner`;

export default function PartnersPage() {
  return (
    <>
      <PageOpening
        label="For partners"
        title="Read coverage before you rely on it."
        lead="Wallets, lending pools and auditors read each institution's verified totals straight from Stellar, for free, without asking the issuer for permission."
        primary={{ label: "Talk to us", href: contactHref }}
        secondary={{ label: "Read the docs", href: site.docsUrl }}
        figure={<IsCoveredFigure />}
      />
      <PartnerVerdicts />
      <PartnerLending />
      <PartnerAuditor />
      <PartnerAlerts />
      <Close
        institutions={{
          label: "For readers",
          title: "Build coverage into your product.",
          body: "Tell us what you want to read and where you want to show it. We will help you wire it in.",
          action: { label: "Read the docs", href: site.docsUrl },
        }}
        readers={{
          label: "For institutions",
          title: "Put an asset on the record.",
          body: "Tell us which asset you issue or hold for customers. We plan a pilot with you and publish your first record together.",
          action: { label: "Talk to us", href: contactHref },
        }}
      />
    </>
  );
}
