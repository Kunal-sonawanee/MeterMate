import type { Metadata } from "next";
import { SettingsScreen } from "@/components/settings/settings-screen";

export const metadata: Metadata = {
  title: "Settings",
  description: "Defaults and appearance.",
};

export default function SettingsPage() {
  return <SettingsScreen />;
}
