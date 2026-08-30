import type { Metadata } from "next";
import { OverviewScreen } from "@/components/overview/overview-screen";

export const metadata: Metadata = {
  title: "Overview",
  description: "Where you are in this month's billing cycle.",
};

export default function OverviewPage() {
  return <OverviewScreen />;
}
