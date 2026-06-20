"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

interface LegalDoc {
  id: string;
  label: string;
  kicker: string;
  title: string;
  intro: string;
  sections: { h: string; b: string }[];
}

const UPDATED = "June 19, 2026";

const docs: LegalDoc[] = [
  {
    id: "privacy",
    label: "Privacy Policy",
    kicker: "Legal · Privacy",
    title: "Privacy Policy",
    intro:
      "How Solva handles the limited information it does collect, and the data it deliberately never touches.",
    sections: [
      {
        h: "What we never collect",
        b: "Solva is built around edge proving. Customer balances, account identifiers, and personal financial data are processed inside your own infrastructure and are never transmitted to or stored by Solva.",
      },
      {
        h: "Information we do collect",
        b: "For accounts and demos we collect basic business contact details you provide, such as name, work email, company, and role, along with standard product and security logs.",
      },
      {
        h: "How we use it",
        b: "We use this information to operate the service, arrange demos, provide support, and keep the platform secure. We do not sell personal information.",
      },
      {
        h: "Data retention",
        b: "Account information is retained while your account is active and for a limited period afterward as required for legal and accounting purposes.",
      },
      {
        h: "Your rights",
        b: "You may request access to, correction of, or deletion of the contact information we hold about you by emailing our team.",
      },
    ],
  },
  {
    id: "terms",
    label: "Terms of Service",
    kicker: "Legal · Terms",
    title: "Terms of Service",
    intro: "The terms that govern access to and use of the Solva platform and APIs.",
    sections: [
      {
        h: "Acceptance",
        b: "By accessing the Solva platform, sandbox, or APIs, you agree to these terms on behalf of yourself and the organization you represent.",
      },
      {
        h: "Use of the service",
        b: "You may use Solva to generate and publish solvency proofs in line with applicable law. You are responsible for the accuracy of the inputs you provide to the prover.",
      },
      {
        h: "Acceptable use",
        b: "You agree not to misuse the service, attempt to break its security, or use it to misrepresent the financial position of any entity.",
      },
      {
        h: "Availability",
        b: "We work to keep the service available and publish incidents on our status page, but the service is provided on an as-is basis without uptime guarantees except where separately agreed.",
      },
      {
        h: "Liability",
        b: "To the extent permitted by law, Solva is not liable for indirect or consequential damages arising from use of the service.",
      },
    ],
  },
  {
    id: "security",
    label: "Security Policy",
    kicker: "Legal · Security",
    title: "Security Policy",
    intro: "Our commitments on platform security and how to report a vulnerability.",
    sections: [
      {
        h: "Architecture",
        b: "Proving runs at the edge inside customer infrastructure. Solva systems handle commitments and proofs, never raw customer data, which limits the impact of any single compromise.",
      },
      {
        h: "Auditing",
        b: "Proving circuits and the Stellar verifier contract are independently audited, and verification logic is reproducible and open to inspection.",
      },
      {
        h: "Responsible disclosure",
        b: "We run a coordinated disclosure program. Report suspected vulnerabilities to security@solva.example; please do not publicly disclose before we have responded.",
      },
      {
        h: "Incident response",
        b: "Confirmed incidents are investigated promptly and disclosed on our public status page, along with the remediation taken.",
      },
    ],
  },
];

function docIndexFromId(id: string | null | undefined): number {
  const found = docs.findIndex((doc) => doc.id === id);
  return found === -1 ? 0 : found;
}

// The selected policy is driven by the ?doc= param, so the sidebar links and the
// footer links share one source of truth and stay in sync on every navigation.
export function LegalShell() {
  const active = docIndexFromId(useSearchParams().get("doc"));
  const doc = docs[active]!;

  return (
    <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-start gap-10 px-7 pb-24 pt-40 lg:grid-cols-[220px_1fr] lg:gap-14">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-[130px]">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-sec">Legal</p>
        <div className="flex flex-col gap-1">
          {docs.map((entry, index) => {
            const selected = index === active;
            return (
              <Link
                key={entry.id}
                href={`/legal?doc=${entry.id}`}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "block rounded-r-lg border-l-2 px-3.5 py-[9px] text-left text-[14.5px] transition-colors",
                  selected
                    ? "border-acc bg-[color-mix(in_oklab,var(--acc)_10%,transparent)] font-semibold text-fg"
                    : "border-transparent font-medium text-sec hover:text-fg",
                )}
              >
                {entry.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-6 border-t border-hair pt-[18px] font-mono text-xs leading-[1.7] text-sec">
          Last updated
          <br />
          <span className="text-fg">{UPDATED}</span>
        </div>
      </aside>

      {/* Doc content. Keyed on the active doc so the fade replays on switch. */}
      <article key={doc.id} className="legal-fade max-w-[680px]">
        <p className="mb-3.5 font-mono text-xs uppercase tracking-[0.16em] text-acc-text">
          {doc.kicker}
        </p>
        <h1 className="font-display text-[clamp(30px,3.6vw,44px)] font-bold leading-[1.05] tracking-[-0.03em]">
          {doc.title}
        </h1>
        <p className="mt-[18px] text-[17px] leading-relaxed text-sec">{doc.intro}</p>
        <div className="my-[26px] border-t border-hair" />

        {doc.sections.map((section) => (
          <div key={section.h}>
            <h2 className="mb-3 mt-[34px] font-display text-[22px] font-semibold tracking-[-0.02em] text-fg first:mt-0">
              {section.h}
            </h2>
            <p className="mb-4 text-[15.5px] leading-[1.7] text-sec">{section.b}</p>
          </div>
        ))}

        <div className="mt-[34px] rounded-[14px] border border-hair bg-surface p-[22px]">
          <p className="text-sm leading-relaxed text-sec">
            This page is a plain-language template for demonstration. Questions about this policy can
            go to <span className="font-mono text-fg">legal@solva.example</span>.
          </p>
        </div>
      </article>
    </div>
  );
}
