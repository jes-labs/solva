import type { Metadata } from "next";
import { Close } from "@/components/layout/close";
import { PageOpening } from "@/components/layout/page-opening";
import { routes } from "@/config/navigation";
import {
  CustodyCompare,
  CustodyFaq,
  CustodyPrivacy,
  CustodyReaders,
  InclusionCheck,
} from "@/features/solutions";

export const metadata: Metadata = {
  title: "For custodial apps",
  description:
    "Prove that your reserves cover the customer balances you hold on Stellar, and let each customer confirm their own was counted, without publishing a list of balances.",
  alternates: { canonical: routes.custodialApps },
};

const contactHref = `${routes.contact}?role=Custodial%20app`;

export default function CustodialAppsPage() {
  return (
    <>
      <PageOpening
        label="For custodial apps and exchanges"
        title="Prove your reserves cover every customer."
        lead="Show that your reserves cover the balances you hold for customers, and let each customer confirm their own was counted, without publishing a list of balances."
        primary={{ label: "Talk to us", href: contactHref }}
        secondary={{ label: "See it work", href: routes.demo }}
        figure={<InclusionCheck />}
        wide
      />
      <CustodyPrivacy />
      <CustodyCompare />
      <CustodyReaders />
      <CustodyFaq />
      <Close
        institutions={{
          label: "For custodial apps",
          title: "Prove it to every customer.",
          body: "Tell us which assets you hold for customers and we will plan a pilot around them, with the customer check built in from day one.",
          action: { label: "Talk to us", href: contactHref },
        }}
      />
    </>
  );
}
