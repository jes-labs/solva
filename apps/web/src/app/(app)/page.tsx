import type { Metadata } from "next";
import { OverviewSection } from "@/components/dashboard/sections/overview-section";

export const metadata: Metadata = {
  title: "Overview",
};

export default function OverviewPage() {
  return <OverviewSection />;
}
