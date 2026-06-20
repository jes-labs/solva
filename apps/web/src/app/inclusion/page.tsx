import type { Metadata } from "next";
import { InclusionClient } from "./inclusion-client";

export const metadata: Metadata = {
  title: "Check my balance",
};

export default function InclusionPage() {
  return <InclusionClient />;
}
