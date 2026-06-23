import type { Metadata } from "next";
import { Reveal } from "@/components/motion";
import { Eyebrow } from "@/components/ui";
import { ContactForm } from "@/components/contact/contact-form";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Solva team. Partnerships, press, or a question about proving reserves on Stellar. We reply within one business day.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact", url: "/contact" },
};

const reasons = [
  {
    n: "01",
    title: "Partnerships & pilots",
    body: "Banks, fintechs, exchanges, and issuers exploring proof of reserves.",
  },
  {
    n: "02",
    title: "Press & ecosystem",
    body: "Writing about Solva, Stellar, or zero-knowledge in finance.",
  },
  {
    n: "03",
    title: "Anything else",
    body: "A question, a correction, or just curious how it works.",
  },
];

export default function ContactPage() {
  return (
    <main className="relative z-[1]">
      <div className="mx-auto grid max-w-site grid-cols-1 items-start gap-16 px-7 pb-24 pt-40 lg:grid-cols-[1fr_1.05fr]">
        {/* Left: intro + ways to reach */}
        <Reveal className="lg:sticky lg:top-[130px]">
          <Eyebrow className="mb-5 text-acc-text">Contact</Eyebrow>
          <h1 className="font-display text-[clamp(34px,4.4vw,54px)] font-bold leading-[1.03] tracking-[-0.035em]">
            Talk to the <span className="font-serif italic text-acc-text">team</span>.
          </h1>
          <p className="mt-5 max-w-[420px] text-[17px] leading-relaxed text-sec">
            Send us a note and a real person will get back to you within one business day. No
            chatbots, no ticket queue.
          </p>

          <div className="mt-8 flex flex-col gap-[18px]">
            {reasons.map((item) => (
              <div key={item.n} className="flex gap-3.5">
                <span className="shrink-0 pt-0.5 font-mono text-[13px] text-acc-text">{item.n}</span>
                <div>
                  <div className="text-[15px] font-semibold text-fg">{item.title}</div>
                  <p className="mt-0.5 text-sm leading-snug text-sec">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-hair pt-[22px]">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-sec">
              Prefer email?
            </p>
            <a
              href="mailto:support@joinsolva.xyz"
              className="font-mono text-[15px] text-fg transition-colors hover:text-acc-text"
            >
              support@joinsolva.xyz
            </a>
            <a
              href={routes.demo}
              className="mt-3 block text-[15px] font-semibold text-acc-text transition-opacity hover:opacity-80"
            >
              Looking for a demo? Request one →
            </a>
          </div>
        </Reveal>

        {/* Right: form */}
        <Reveal>
          <ContactForm />
        </Reveal>
      </div>
    </main>
  );
}
