import type { Metadata } from "next";
import { PropertiesScreen } from "@/components/properties/properties-screen";

export const metadata: Metadata = {
  title: "Properties",
  description: "The buildings and units you bill for.",
};

export default function PropertiesPage() {
  return <PropertiesScreen />;
}
