import type { Metadata } from "next";
import { PageOpening } from "@/components/layout/page-opening";
import { LeaderRow, Provenance } from "@/components/ui/ledger";
import { routes } from "@/config/navigation";
import { site } from "@/config/site";
import { exampleRecords } from "@/lib/example-records";
import {
  AfterYouWrite,
  ContactForm,
  OtherChannels,
  WriteSection,
  readPrefill,
} from "@/features/contact";

export const metadata: Metadata = {
  title: "Talk to us",
  description:
    "Write to the Solva team about a pilot for your anchor or custodial app, about reading coverage as a wallet or lending pool, or about checking it as an auditor.",
  alternates: { canonical: routes.contact },
};

interface ContactPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function ContactFigure() {
  return (
    <div className="ruled-marks relative border border-line bg-bg p-5 sm:p-6">
      <p className="text-small text-sec">Talking to Solva</p>
      <div className="mt-4 flex flex-col gap-2.5">
        <LeaderRow label="Who reads it" value="A person on the team" />
        <LeaderRow label="Reply within" value="1 working day" />
        <LeaderRow label="From" value={site.contactEmail} />
        <LeaderRow label="Pilots" value="Open" tone="signal" />
      </div>
      <Provenance parts={["No ticket queue", "No customer data needed"]} className="mt-5" />
    </div>
  );
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const prefill = readPrefill(await searchParams);
  return (
    <>
      <PageOpening
        label="Contact"
        title="Talk to us."
        lead="Tell us which asset you issue or hold, or what you want to read from the record. A person on the team reads every message and replies within one working day."
        primary={{ label: "Write to the team", href: "#write" }}
        secondary={{ label: "Join the waitlist", href: routes.waitlist }}
        figure={<ContactFigure />}
      />
      <WriteSection
        id="write"
        label="Write to us"
        title="Write to the team"
        body="The more we know about the asset, the more useful the first reply. Name the token, say roughly how many holders or customers it has, and tell us where the reserves are held."
        record={exampleRecords[0]}
        caption="Example: what a pilot ends with"
      >
        <ContactForm prefill={prefill} />
      </WriteSection>
      <AfterYouWrite />
      <OtherChannels />
    </>
  );
}
