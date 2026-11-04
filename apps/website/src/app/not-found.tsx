import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { PageOpening } from "@/components/layout/page-opening";
import { Chapter, ChapterHead, Provenance } from "@/components/ui/ledger";
import { SealInstrument } from "@/components/ui/seal-instrument";
import { StateStamp } from "@/components/ui/state-stamp";
import { routes } from "@/config/navigation";

export const metadata: Metadata = {
  title: "Page not found",
};

const DESTINATIONS = [
  {
    label: "Home",
    note: "What Solva records, who reads it, and how a result is proven on Stellar.",
    href: routes.home,
  },
  {
    label: "For anchors",
    note: "Show holders and partners that your token is backed, checked by a contract on Stellar.",
    href: routes.anchors,
  },
  {
    label: "For custodial apps",
    note: "Prove your reserves cover what you owe customers, and let each one check that their balance was counted.",
    href: routes.custodialApps,
  },
  {
    label: "Contact",
    note: "Write to the team about a pilot for your asset. A person reads every message and replies.",
    href: routes.contact,
  },
] as const;

function MissingRecord() {
  return (
    <article
      aria-label="No record at this address"
      className="ruled-marks relative mx-auto w-full max-w-[26rem] border border-line bg-bg p-6 lg:mr-0"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-small text-sec">joinsolva.xyz</p>
          <p className="mt-1 font-display text-h3">This address</p>
        </div>
        <StateStamp state="stale" label="No record" />
      </header>
      <div className="mt-6 flex items-center gap-6">
        <SealInstrument
          mode="meter"
          share={0}
          state="stale"
          size="compact"
          className="w-24 shrink-0"
        >
          <span className="font-display text-[1.5rem] leading-none num text-faint">404</span>
        </SealInstrument>
        <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 font-mono text-small num">
          <div>
            <dt className="font-sans text-small text-sec">Published</dt>
            <dd className="mt-1">Never</dd>
          </div>
          <div>
            <dt className="font-sans text-small text-sec">Last proof</dt>
            <dd className="mt-1">None</dd>
          </div>
        </dl>
      </div>
      <Provenance parts={["No ledger", "No date", "Nothing to verify"]} className="mt-6" />
    </article>
  );
}

export default function NotFound() {
  return (
    <>
      <PageOpening
        label="Page not found"
        title="This page is not on the record."
        lead="Nothing is published at this address. The page may have moved when the site was rebuilt, or the link has a typo."
        primary={{ label: "Back to the home page", href: routes.home }}
        figure={<MissingRecord />}
      />
      <Chapter labelledBy="destinations-title">
        <ChapterHead
          id="destinations-title"
          label="Where to go"
          title="Where to go instead."
          lead="Most old addresses forward to their new page on their own. If a link from another site brought you here, one of these pages holds what it pointed to."
        />
        <ul className="mt-14 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {DESTINATIONS.map((destination) => (
            <li
              key={destination.href}
              className="border-b border-line sm:odd:border-r lg:border-r lg:last:border-r-0"
            >
              <Link
                href={destination.href}
                className="group flex h-full flex-col gap-6 p-6 transition-colors hover:bg-raised"
              >
                <span
                  aria-hidden="true"
                  className="h-0.5 w-6 bg-line-strong transition-colors group-hover:bg-signal"
                />
                <span className="flex items-center gap-2 font-display text-h3">
                  {destination.label}
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
                <span className="text-body text-sec">{destination.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Chapter>
    </>
  );
}
