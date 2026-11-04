import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { routes } from "@/config/navigation";
import { site } from "@/config/site";

const LINKS = [
  {
    label: "Read the documentation",
    note: "The full detail: how the proof is built, what the contract checks, and how to read a record from code.",
    href: site.docsUrl,
    external: true,
  },
  {
    label: "See a full coverage record",
    note: "The record sheet field by field, a year of history, and the three readers' views.",
    href: routes.coverageRecord,
    external: false,
  },
  {
    label: "Watch a check run",
    note: "The real pipeline against Stellar Testnet, run from your browser.",
    href: routes.demo,
    external: false,
  },
] as const;

const linkClass =
  "group flex items-center justify-between gap-6 py-5 text-text transition-colors hover:text-sec";

export function FurtherReading() {
  return (
    <Chapter id="further-reading" index="03" labelledBy="further-title">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <ChapterHead
          id="further-title"
          label="Further reading"
          title="The deeper detail lives in the docs."
        />
        <ul className="border-t border-line lg:mt-2">
          {LINKS.map((link) => (
            <li key={link.href} className="border-b border-line">
              {link.external ? (
                <a href={link.href} target="_blank" rel="noreferrer" className={linkClass}>
                  <span>
                    <span className="block font-display text-h3">{link.label}</span>
                    <span className="mt-1 block text-small text-sec">{link.note}</span>
                  </span>
                  <ArrowUpRightIcon aria-hidden="true" className="size-4 shrink-0" />
                </a>
              ) : (
                <Link href={link.href} className={linkClass}>
                  <span>
                    <span className="block font-display text-h3">{link.label}</span>
                    <span className="mt-1 block text-small text-sec">{link.note}</span>
                  </span>
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Chapter>
  );
}
