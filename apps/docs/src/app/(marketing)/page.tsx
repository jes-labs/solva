import Link from "next/link";
import { appUrl } from "@/lib/shared";

const entries = [
  { title: "Quickstart", body: "Prove solvency end to end in a few minutes.", href: "/docs/quickstart" },
  { title: "SDK reference", body: "The @solva/sdk-ts surface: cycles, proofs, inclusion.", href: "/docs/sdk-reference" },
  { title: "Sandbox", body: "Run against mock open-banking data before you go live.", href: "/docs/sandbox" },
  { title: "Contract address", body: "The deployed proof-registry contract on Stellar.", href: "/docs/contract-address" },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-7 py-20 sm:py-28">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-fd-primary">Documentation</p>
        <h1 className="mt-4 text-balance text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.04] tracking-tight">
          Build on Solva.
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-lg leading-relaxed text-fd-muted-foreground">
          Everything you need to prove reserves meet liabilities on Stellar: the SDK, the sandbox,
          the contract, and the proving flow.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/docs"
            className="inline-flex h-11 items-center rounded-md bg-fd-primary px-6 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90"
          >
            Read the docs
          </Link>
          <Link
            href="/docs/quickstart"
            className="inline-flex h-11 items-center rounded-md border border-fd-border px-6 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
          >
            Quickstart
          </Link>
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-md border border-fd-border px-6 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
          >
            Launch app ↗
          </a>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            className="group rounded-xl border border-fd-border bg-fd-card p-6 transition-colors hover:border-fd-primary/50"
          >
            <h2 className="text-[17px] font-semibold tracking-tight text-fd-card-foreground">
              {entry.title}
            </h2>
            <p className="mt-1.5 text-sm leading-snug text-fd-muted-foreground">{entry.body}</p>
            <span className="mt-3 inline-block text-[13px] font-medium text-fd-primary">Open →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
