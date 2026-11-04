import Link from "next/link";
import { ArrowUpRightIcon, GithubLogoIcon, XLogoIcon } from "@phosphor-icons/react/ssr";
import { BrandLockup, BrandWatermark, SealMatrix } from "@/components/ui/brand";
import { explorer, shortHash, verifierEvidence } from "@/config/evidence";
import { footerColumns, routes } from "@/config/navigation";
import { site } from "@/config/site";

const YEAR = 2026;

const EVIDENCE = [
  {
    label: "Verifier contract",
    value: shortHash(verifierEvidence.contractId, 10, 6),
    href: explorer.contract(verifierEvidence.contractId),
  },
  {
    label: "Verified proof",
    value: `${shortHash(verifierEvidence.verifyTx, 8, 6)} · ledger ${verifierEvidence.verifiedAtLedger.toLocaleString("en-US")}`,
    href: explorer.tx(verifierEvidence.verifyTx),
  },
  { label: "Fee per verification", value: `${verifierEvidence.feeXlm} XLM` },
  {
    label: "Network",
    value: `Stellar ${verifierEvidence.network} · protocol ${verifierEvidence.protocol}`,
  },
] as const;

const SOCIAL = [
  { label: "Solva on X", href: site.xUrl, Icon: XLogoIcon },
  { label: "Solva on GitHub", href: site.githubUrl, Icon: GithubLogoIcon },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative mt-16 overflow-hidden">
      <div className="site-column">
        <div
          aria-hidden="true"
          className="h-px bg-[linear-gradient(90deg,transparent,var(--s-signal)_30%,var(--s-signal)_70%,transparent)] opacity-60"
        />

        <div className="grid gap-12 px-5 pt-16 pb-12 sm:px-8 lg:grid-cols-[1.1fr_2fr] lg:gap-16 lg:px-12 lg:pt-20">
          <div>
            <BrandLockup className="h-9" />
            <p className="mt-6 max-w-xs text-body text-sec">
              A daily public record that an anchor or custodial app on Stellar holds what it owes,
              proven every day and checked by a contract on Stellar.
            </p>
            <ul className="mt-7 flex gap-2.5">
              {SOCIAL.map(({ label, href, Icon }) => (
                <li key={href}>
                  <a
                    href={href}
                    aria-label={label}
                    className="flex size-10 items-center justify-center rounded-full border border-line text-text transition-colors hover:border-line-strong hover:bg-raised"
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.label}>
                <h2 className="text-small font-semibold text-text">{column.label}</h2>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          className="inline-flex items-center gap-1 text-small text-sec transition-colors hover:text-text"
                        >
                          {link.label}
                          <ArrowUpRightIcon aria-hidden="true" className="size-3" />
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-small text-sec transition-colors hover:text-text"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <dl className="grid border-y border-line sm:grid-cols-2 lg:grid-cols-4">
          {EVIDENCE.map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-1.5 border-b border-line px-5 py-4 sm:px-8 lg:border-b-0 lg:px-12 lg:not-last:border-r"
            >
              <dt className="text-small text-sec">{item.label}</dt>
              <dd className="font-mono text-small text-text num">
                {"href" in item ? (
                  <a
                    href={item.href}
                    className="inline-flex items-center gap-1 underline decoration-line-strong underline-offset-4 hover:decoration-text"
                  >
                    {item.value}
                    <ArrowUpRightIcon aria-hidden="true" className="size-3 text-faint" />
                  </a>
                ) : (
                  item.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="relative isolate">
          <SealMatrix className="pointer-events-none absolute top-1/2 left-4 -z-10 hidden w-[9rem] -translate-y-1/2 opacity-100 md:block dark:opacity-70 lg:left-10 lg:w-[11rem]" />
          <SealMatrix className="pointer-events-none absolute top-1/2 right-4 -z-10 hidden w-[9rem] -translate-y-1/2 rotate-180 opacity-100 md:block dark:opacity-70 lg:right-10 lg:w-[11rem]" />
          <div className="px-5 py-16 sm:px-8 md:px-[11rem] lg:px-[14rem] lg:py-24">
            <div data-reveal>
              <BrandWatermark />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line px-5 py-5 text-small text-sec sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p>Built by the Solva team. Open source under Apache 2.0.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <span>© {YEAR} Solva. All rights reserved.</span>
            <Link href={routes.legal} className="text-text hover:text-acc-text">
              Terms and privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
