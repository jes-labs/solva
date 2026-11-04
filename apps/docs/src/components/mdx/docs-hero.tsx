import { SealGlyph } from "@/components/brand/docs-lockup";

export function DocsHero() {
  return (
    <div className="docs-hero not-prose">
      <SealGlyph className="docs-hero-seal" />
      <div>
        <p className="eyebrow">Solva documentation</p>
        <p className="docs-hero-lead">
          Proof that reserves cover what is owed, published on Stellar every day, with no customer
          balance revealed.
        </p>
      </div>
    </div>
  );
}
