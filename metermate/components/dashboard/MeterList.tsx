"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeIndianRupee,
  CalendarRange,
  CircleGauge,
  MapPin,
  Siren,
  Sparkles,
  Zap,
} from "lucide-react";
import { getMeterDetails, type MeterDetail } from "@/lib/api";

type MeterCard = MeterDetail & {
  latestReading: MeterDetail["readings"][number] | null;
};

type MeterModalState = MeterCard | null;

export default function MeterList() {
  const [selectedMeter, setSelectedMeter] = useState<MeterModalState>(null);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedMeter(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const { data: meters = [], isLoading } = useQuery<MeterDetail[]>({
    queryKey: ["meter-details"],
    queryFn: getMeterDetails,
  });

  const cards = useMemo<MeterCard[]>(() => {
    return meters.map((meter) => {
      const latestReading = [...meter.readings].sort((left, right) => {
        if (left.year !== right.year) return right.year - left.year;
        if (left.month !== right.month) return right.month - left.month;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      })[0];

      return {
        ...meter,
        latestReading,
      };
    });
  }, [meters]);

  if (isLoading) {
    return (
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </section>
    );
  }

  return (
    <section id="meters" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Meters</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tap a meter to view the latest usage snapshot.
          </p>
        </div>
        <p className="text-sm font-medium text-slate-500">{cards.length} total</p>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Siren className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-900">No meters yet.</p>
          <p className="mt-1 text-sm text-slate-500">Add a property first, then create meters for it.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((meter) => (
            <article
              key={meter.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{meter.name}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {meter.property.name}
                  </div>
                </div>

                <div className="rounded-full bg-white p-2 text-slate-900 shadow-sm ring-1 ring-slate-200">
                  <Zap className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Current Reading</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {meter.latestReading ? Number(meter.latestReading.currentReading) : 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Last Updated</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {meter.latestReading
                      ? new Date(meter.latestReading.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })
                      : "No readings yet"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMeter(meter)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98]"
              >
                View details
                <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      )}

      {selectedMeter && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close meter details"
            onClick={() => setSelectedMeter(null)}
            className="absolute inset-0 h-full w-full cursor-default"
          />

          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-2xl p-3 sm:inset-y-0 sm:right-0 sm:bottom-auto sm:w-110 sm:p-4">
            <div className="relative flex h-[88vh] max-h-190 flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl ring-1 ring-slate-200 sm:h-full sm:rounded-[28px]">
              <div className="h-1.5 w-14 self-center rounded-full bg-slate-200 sm:hidden" />

              <div className="bg-linear-to-br from-slate-900 via-slate-800 to-indigo-900 px-5 py-6 text-white sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                      <Sparkles className="h-3.5 w-3.5" />
                      Meter detail
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold tracking-tight">{selectedMeter.name}</h3>
                    <p className="mt-1 text-sm text-slate-300">{selectedMeter.property.name}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedMeter(null)}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <StatTile
                    label="Current reading"
                    value={selectedMeter.latestReading ? Number(selectedMeter.latestReading.currentReading) : 0}
                    tone="dark"
                    icon={<CircleGauge className="h-4 w-4" />}
                  />
                  <StatTile
                    label="Latest bill"
                    value={`₹ ${selectedMeter.latestReading ? Number(selectedMeter.latestReading.billAmount).toLocaleString("en-IN") : "0"}`}
                    tone="dark"
                    icon={<BadgeIndianRupee className="h-4 w-4" />}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="space-y-3">
                  <DetailRow label="Property" value={selectedMeter.property.name} />
                  <DetailRow
                    label="Meter Number"
                    value={selectedMeter.meterNumber || "Not set"}
                  />
                  <DetailRow
                    label="Last updated"
                    value={
                      selectedMeter.latestReading
                        ? new Date(selectedMeter.latestReading.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "No readings yet"
                    }
                  />
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Recent readings
                    </h4>
                    <CalendarRange className="h-4 w-4 text-slate-400" />
                  </div>

                  {selectedMeter.readings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                      No readings available for this meter.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...selectedMeter.readings]
                        .sort((left, right) => {
                          if (left.year !== right.year) return right.year - left.year;
                          if (left.month !== right.month) return right.month - left.month;
                          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
                        })
                        .slice(0, 5)
                        .map((reading) => (
                          <div
                            key={reading.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {reading.month}/{reading.year}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Previous {Number(reading.previousReading)} → Current {Number(reading.currentReading)}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Bill</p>
                                <p className="text-sm font-semibold text-slate-900">
                                  ₹ {Number(reading.billAmount).toLocaleString("en-IN")}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                              <span>Units: {Number(reading.unitsConsumed)}</span>
                              <span>Rate: ₹ {Number(reading.ratePerUnit).toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone: "dark" | "light";
}) {
  const classes =
    tone === "dark"
      ? "bg-white/10 text-white border-white/15"
      : "bg-white text-slate-900 border-slate-200";

  return (
    <div className={`rounded-2xl border p-4 ${classes}`}>
      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wide opacity-80">
        <span>{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}