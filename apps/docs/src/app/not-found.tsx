import Link from "next/link";
import { SealGlyph } from "@/components/brand/docs-lockup";
import { websiteUrl } from "@/lib/shared";

export default function NotFound() {
  return (
    <main className="not-found">
      <SealGlyph className="not-found-seal" />
      <p className="eyebrow">404</p>
      <h1>This page is not in the docs</h1>
      <p className="not-found-lead">The link may be out of date, or the page may have moved.</p>
      <div className="not-found-actions">
        <Link href="/docs" className="button-primary">
          Go to the docs home
        </Link>
        <a href={websiteUrl} className="button-secondary">
          Visit joinsolva.xyz
        </a>
      </div>
    </main>
  );
}
