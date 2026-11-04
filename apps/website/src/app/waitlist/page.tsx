import type { Metadata } from "next";
import { Close } from "@/components/layout/close";
import { PageOpening } from "@/components/layout/page-opening";
import { SealInstrument } from "@/components/ui/seal-instrument";
import { routes } from "@/config/navigation";
import { exampleRecords } from "@/lib/example-records";
import { WaitlistForm, WaitlistNext, WriteSection } from "@/features/contact";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description:
    "Publishing on Solva opens to pilot partners first. Join the waitlist and we will write to you when it opens to your organisation.",
  alternates: { canonical: routes.waitlist },
};

export default function WaitlistPage() {
  return (
    <>
      <PageOpening
        label="Waitlist"
        title="Join the waitlist."
        lead="Publishing a coverage record opens to pilot partners first. Leave three details. We send a confirmation straight away, and write again when publishing opens to your organisation."
        primary={{ label: "Join the waitlist", href: "#join" }}
        secondary={{ label: "Ask about a pilot", href: routes.contact }}
        figure={
          <SealInstrument
            mode="progress"
            step={1}
            steps={3}
            title="Three steps from the waitlist to a published record, one done"
            className="mx-auto w-56 sm:w-64"
          >
            <span className="seal-value font-display num">1/3</span>
            <span className="mt-2 text-small text-sec">join, pilot, publish</span>
          </SealInstrument>
        }
        provenance={["Pilot partners first", "Invited by email"]}
      />
      <WriteSection
        id="join"
        label="Your place in line"
        title="Three details are enough."
        body="We use them to invite you to publish, and for nothing else. We do not ask for customer data or balances."
        record={exampleRecords[1]}
        caption="Example: what you will publish"
      >
        <WaitlistForm />
      </WriteSection>
      <WaitlistNext />
      <Close />
    </>
  );
}
