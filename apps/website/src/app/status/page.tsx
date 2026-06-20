import type { Metadata } from "next";
import { Reveal } from "@/components/motion";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Status",
  description:
    "Live status and changelog for the Solva platform: proving, publishing to Stellar, registry and verify, the solvency oracle, and the sandbox.",
  alternates: { canonical: "/status" },
  openGraph: { title: "Status", url: "/status" },
};

const sectionX = "mx-auto max-w-[980px] px-7";

const BAR_GOOD = "color-mix(in oklab, var(--acc) 70%, var(--hair-strong))";
const BAR_BAD = "var(--amber)";

// 60 days of uptime bars. Healthy components are clean; the rest mark the two
// incident days in amber. Mocked here until the SDK issue wires real history.
function uptimeBars(perfect: boolean): string[] {
  return Array.from({ length: 60 }, (_, i) =>
    !perfect && (i === 14 || i === 41) ? BAR_BAD : BAR_GOOD,
  );
}

const components = [
  { name: "Proving API", desc: "Generate proofs", uptime: "99.99%", perfect: true },
  { name: "Publish · Stellar", desc: "Settle on-chain", uptime: "99.98%", perfect: false },
  { name: "Registry & Verify", desc: "Lookup and verify", uptime: "100.0%", perfect: true },
  { name: "Solvency Oracle", desc: "MCP & API feed", uptime: "99.97%", perfect: true },
  { name: "Sandbox", desc: "Mock environment", uptime: "100.0%", perfect: true },
];

const incidents = [
  {
    date: "May 02, 2026",
    dot: "var(--amber)",
    title: "Elevated publish latency",
    body: "A Stellar network upgrade briefly increased settlement times. Proofs were queued and published without loss once finality recovered.",
  },
  {
    date: "Mar 18, 2026",
    dot: "var(--amber)",
    title: "Registry read delays",
    body: "A caching layer returned stale reads for roughly 12 minutes. Verification fell back to direct on-chain reads with no incorrect results.",
  },
  {
    date: "Jan 09, 2026",
    dot: "var(--acc)",
    title: "Scheduled maintenance",
    body: "Planned upgrade of the proving cluster completed ahead of window with no customer impact.",
  },
];

const changelog = [
  {
    version: "v1.6",
    date: "Jun 2026",
    title: "Solvency oracle over MCP",
    items: [
      "Added the check_solvency MCP tool for agent runtimes",
      "Public REST solvency endpoint with proof references",
      "Lower-latency registry reads",
    ],
  },
  {
    version: "v1.5",
    date: "May 2026",
    title: "Selective disclosure",
    items: [
      "Scoped, attested disclosures for supervisors",
      "Disclosure audit trail in the registry",
      "SDK helpers for disclosure requests",
    ],
  },
  {
    version: "v1.4",
    date: "Apr 2026",
    title: "Continuous proving",
    items: [
      "Per-block proving schedules",
      "Margin alerts as solvency nears a breach",
      "Sandbox parity with mainnet flows",
    ],
  },
  {
    version: "v1.3",
    date: "Mar 2026",
    title: "Edge prover GA",
    items: [
      "Production edge prover for VPC deployment",
      "Hardware-accelerated proving",
      "Reproducible verifier builds",
    ],
  },
];

export default function StatusPage() {
  return (
    <main className="relative z-[1]">
      {/* All-systems banner */}
      <header className={`${sectionX} pt-40`}>
        <Reveal>
          <div
            className="flex flex-wrap items-center justify-between gap-6 rounded-panel bg-surface p-8"
            style={{ border: "1px solid color-mix(in oklab, var(--acc) 30%, var(--hair))" }}
          >
            <div className="flex items-center gap-4">
              <span
                className="size-3.5 shrink-0 rounded-full bg-acc"
                style={{ boxShadow: "0 0 14px 2px var(--acc)" }}
                aria-hidden="true"
              />
              <div>
                <h1 className="font-display text-[clamp(22px,2.6vw,30px)] font-semibold tracking-tight">
                  All systems operational
                </h1>
                <p className="mt-1.5 font-mono text-sm text-sec">
                  updated just now · 90-day uptime 99.99%
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" href="mailto:hello@solva.example?subject=Status%20updates">
              Subscribe to updates
            </Button>
          </div>
        </Reveal>
      </header>

      {/* Component uptime */}
      <section className={`${sectionX} pt-6`}>
        <Reveal>
          <div className="rounded-panel border border-hair bg-surface px-7 py-3.5">
            {components.map((component) => (
              <div
                key={component.name}
                className="flex flex-col gap-3 border-b border-hair py-[18px] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="order-1 sm:min-w-[200px]">
                  <div className="text-[15.5px] font-medium text-fg">{component.name}</div>
                  <div className="mt-0.5 text-[13px] text-sec">{component.desc}</div>
                </div>
                <div className="order-3 flex flex-1 items-center gap-[3px] sm:order-2 sm:max-w-[360px] sm:justify-center">
                  {uptimeBars(component.perfect).map((color, i) => (
                    <span
                      key={i}
                      className="h-[26px] min-w-0 max-w-[5px] flex-1 rounded-[2px]"
                      style={{ background: color }}
                    />
                  ))}
                </div>
                <div className="order-2 flex items-center gap-2 sm:order-3 sm:min-w-[120px] sm:justify-end">
                  <span className="size-2 rounded-full bg-acc" aria-hidden="true" />
                  <span className="font-mono text-[12.5px] text-acc-text">{component.uptime}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between pb-1 pt-3 font-mono text-[11px] text-sec">
              <span>90 days ago</span>
              <span>today</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Recent incidents */}
      <section className={`${sectionX} pt-10`}>
        <Reveal>
          <h2 className="mb-[18px] font-display text-[22px] font-semibold tracking-tight">
            Recent incidents
          </h2>
        </Reveal>
        <Reveal>
          <div className="rounded-card border border-hair bg-surface px-7 py-1">
            {incidents.map((incident) => (
              <div
                key={incident.title}
                className="grid grid-cols-1 gap-2 border-b border-hair py-[18px] last:border-b-0 sm:grid-cols-[130px_1fr] sm:gap-5"
              >
                <div className="font-mono text-[12.5px] text-sec">{incident.date}</div>
                <div>
                  <div className="mb-1.5 flex items-center gap-2.5">
                    <span
                      className="size-[7px] shrink-0 rounded-full"
                      style={{ background: incident.dot }}
                      aria-hidden="true"
                    />
                    <span className="text-[15px] font-semibold text-fg">{incident.title}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-sec">{incident.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Changelog */}
      <section className={`${sectionX} pb-24 pt-10`}>
        <Reveal>
          <h2 className="mb-[18px] font-display text-[22px] font-semibold tracking-tight">
            Changelog
          </h2>
        </Reveal>
        <div className="flex flex-col gap-3.5">
          {changelog.map((release) => (
            <Reveal key={release.version}>
              <div className="grid grid-cols-1 gap-4 rounded-card border border-hair bg-surface p-[26px] sm:grid-cols-[150px_1fr] sm:gap-6">
                <div>
                  <span className="mb-2 inline-block rounded-md bg-acc px-2.5 py-1 font-mono text-xs text-on-acc">
                    {release.version}
                  </span>
                  <div className="font-mono text-xs text-sec">{release.date}</div>
                </div>
                <div>
                  <h3 className="mb-2.5 font-display text-[18px] font-semibold tracking-tight">
                    {release.title}
                  </h3>
                  <div className="flex flex-col gap-[7px]">
                    {release.items.map((item) => (
                      <div key={item} className="flex gap-2.5 text-[14.5px] leading-snug text-sec">
                        <span className="shrink-0 text-acc-text">+</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
