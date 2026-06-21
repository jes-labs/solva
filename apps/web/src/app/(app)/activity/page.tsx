import type { Metadata } from "next";
import { ActivitySection } from "@/components/dashboard/sections/activity-section";

export const metadata: Metadata = {
  title: "Activity",
};

export default function ActivityPage() {
  return <ActivitySection />;
}
