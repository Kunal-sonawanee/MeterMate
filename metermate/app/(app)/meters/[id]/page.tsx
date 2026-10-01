import type { Metadata } from "next";
import { MeterDetailScreen } from "@/components/meters/meter-detail-screen";

export const metadata: Metadata = {
  title: "Meter",
};

export default async function MeterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MeterDetailScreen meterId={id} />;
}
