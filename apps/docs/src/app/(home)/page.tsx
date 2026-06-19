import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-16 text-center">
      <h1 className="mb-3 text-3xl font-bold">Solva documentation</h1>
      <p className="mb-6 text-fd-muted-foreground">
        Proof of Solvency on Stellar. Reserves greater than or equal to liabilities, proven, not
        sampled.
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/docs" className="font-medium underline">
          Read the docs
        </Link>
        <Link href="/blog" className="font-medium underline">
          Blog
        </Link>
      </div>
    </main>
  );
}
