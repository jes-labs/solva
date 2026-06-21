import type { Metadata } from "next";
import { InclusionClient } from "./inclusion-client";

export const metadata: Metadata = {
  title: "Check my balance",
  description:
    "Enter the reference your institution gave you to confirm your balance is included in the latest proof on Stellar. Reveals only yes or no.",
  alternates: { canonical: "/inclusion" },
  robots: { index: true, follow: true },
  openGraph: { title: "Check my balance", url: "/inclusion" },
};

export default function InclusionPage() {
  return <InclusionClient />;
}
