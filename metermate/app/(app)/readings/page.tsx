import type { Metadata } from "next";
import { ReadingsScreen } from "@/components/readings/readings-screen";

export const metadata: Metadata = {
  title: "Readings",
  description:
    "Every meter reading you have recorded, with units and bill amounts.",
};

export default function ReadingsPage() {
  return <ReadingsScreen />;
}
