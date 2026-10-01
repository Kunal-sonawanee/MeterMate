import type { Metadata } from "next";
import { HomeScreen } from "@/components/home/home-screen";

export const metadata: Metadata = {
  title: "Home",
  description: "Record this month's readings and see where the bill stands.",
};

export default function HomePage() {
  return <HomeScreen />;
}
