import type { Metadata } from "next";
import { SourcesSection } from "@/components/dashboard/sections/sources-section";

export const metadata: Metadata = {
  title: "Sources",
};

export default function SourcesPage() {
  return <SourcesSection />;
}
