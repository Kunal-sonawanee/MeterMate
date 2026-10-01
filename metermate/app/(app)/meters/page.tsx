import type { Metadata } from "next";
import { MetersScreen } from "@/components/meters/meters-screen";

export const metadata: Metadata = {
  title: "Meters",
  description: "Every meter you track, with its latest reading.",
};

export default function MetersPage() {
  return <MetersScreen />;
}
