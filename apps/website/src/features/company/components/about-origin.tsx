import { Chapter, ChapterHead } from "@/components/ui/ledger";

const PARAGRAPHS = [
  "Solva started at the Stellar Real-World ZK hackathon, with a simple question. An anchor's token supply is already public on Stellar, so why is what backs it still a quarterly PDF? The judges ran the build themselves and asked for it to continue.",
  "We settled on a daily record. Every day, an institution proves that its reserves cover what it owes, a contract on Stellar checks the proof, and the result is written where anyone can read it. The proof hides every balance. The record hides nothing about the result.",
  "We build for institutions that do not have an audit firm on retainer: anchors issuing local fiat tokens, and custodial apps and exchanges that hold customer money and move it over Stellar. Their holders, their partners and their auditors all read the same record.",
] as const;

export function AboutOrigin() {
  return (
    <Chapter index="01" labelledBy="origin-title">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <ChapterHead
          id="origin-title"
          label="Where it comes from"
          title="Why Solva writes a record every day."
        />
        <div className="flex flex-col gap-6 text-[1.0625rem] leading-[1.65] text-sec lg:pt-2">
          {PARAGRAPHS.map((paragraph) => (
            <p key={paragraph} className="first:text-lead first:text-text">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </Chapter>
  );
}
