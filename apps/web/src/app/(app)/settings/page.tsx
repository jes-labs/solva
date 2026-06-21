import type { Metadata } from "next";
import { SettingsSection } from "@/components/dashboard/sections/settings-section";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return <SettingsSection />;
}
