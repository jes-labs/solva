import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { site } from "@/config/site";

interface Channel {
  topic: string;
  label: string;
  href: string;
  note: string;
  external: boolean;
}

const CHANNELS: readonly Channel[] = [
  {
    topic: "Security reports",
    label: site.securityEmail,
    href: `mailto:${site.securityEmail}`,
    note: "Report a vulnerability privately rather than in a public issue. We reply to every report and credit the reporter.",
    external: false,
  },
  {
    topic: "Code and issues",
    label: "Solva on GitHub",
    href: site.githubUrl,
    note: "Read the code, open an issue or send a pull request. Solva is open source under Apache 2.0.",
    external: true,
  },
  {
    topic: "Building on the record",
    label: "docs.joinsolva.xyz",
    href: site.docsUrl,
    note: "Guides for wallets, lending pools and auditors that read coverage, plus the contract reference.",
    external: true,
  },
  {
    topic: "Everything else",
    label: site.contactEmail,
    href: `mailto:${site.contactEmail}`,
    note: "Press, partnerships and anything the form does not cover.",
    external: false,
  },
];

export function OtherChannels() {
  return (
    <Chapter index="03" labelledBy="channels-title" tone="ink">
      <ChapterHead id="channels-title" label="Other channels" title="Other ways to reach us." />
      <dl className="mt-14 grid border border-line md:grid-cols-2">
        {CHANNELS.map((channel) => (
          <div
            key={channel.topic}
            className="flex flex-col gap-3 border-b border-line p-6 last:border-b-0 md:odd:border-r md:nth-last-[-n+2]:border-b-0"
          >
            <dt className="text-small font-medium text-sec">{channel.topic}</dt>
            <dd>
              <a
                href={channel.href}
                {...(channel.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className="inline-flex items-center gap-2 font-display text-h3 break-all text-text underline decoration-line-strong underline-offset-[6px] transition-colors hover:decoration-text"
              >
                {channel.label}
                <ArrowUpRightIcon aria-hidden="true" className="size-4 flex-none" />
              </a>
            </dd>
            <dd className="text-body text-sec">{channel.note}</dd>
          </div>
        ))}
      </dl>
    </Chapter>
  );
}
