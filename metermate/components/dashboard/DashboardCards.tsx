"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Bolt, IndianRupee, Plus, Zap } from "lucide-react";
import { getDashboard } from "@/lib/api";
type DashboardData = {
  totalMeters: number;
  totalUnits: number;
  totalBill: number;
  latestReadings: Array<{
    meterId: string;
    meterName: string;
    propertyName: string;
    latestReading: {
      id: string;
      month: number;
      year: number;
      previousReading: string;
      currentReading: string;
      unitsConsumed: string;
      ratePerUnit: string;
      billAmount: string;
      createdAt: string;
    } | null;
  }>;
  recentReadings: Array<{
    id: string;
    month: number;
    year: number;
    previousReading: string;
    currentReading: string;
    unitsConsumed: string;
    ratePerUnit: string;
    billAmount: string;
    meter: {
      id: string;
      name: string;
      property: {
        id: string;
        name: string;
      };
    };
  }>;
};

export default function DashboardCards() {
  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  if (isLoading || !dashboard) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-indigo-900 p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-300">August Summary</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              ₹ {formatCurrency(dashboard.totalBill)}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Total bill for the latest reading cycle.
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href="#reading-form"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-medium text-slate-900 transition active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add Reading
            </a>

            <a
              href="#setup"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98]"
            >
              Add Meter
            </a>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          icon={<Bolt className="h-5 w-5" />}
          title="Active Meters"
          value={dashboard.totalMeters}
          tone="slate"
        />

        <Card
          icon={<Activity className="h-5 w-5" />}
          title="Total Units Consumed"
          value={dashboard.totalUnits}
          tone="indigo"
        />

        <Card
          icon={<IndianRupee className="h-5 w-5" />}
          title="Total Bill"
          value={`₹ ${formatCurrency(dashboard.totalBill)}`}
          tone="emerald"
        />

        <Card
          icon={<Zap className="h-5 w-5" />}
          title="Recent Readings"
          value={dashboard.recentReadings.length}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Latest Reading by Meter
          </h2>

          {dashboard.latestReadings.length === 0 ? (
            <p className="text-sm text-slate-500">No readings yet.</p>
          ) : (
            <div className="space-y-3">
              {dashboard.latestReadings.map((entry) => (
                <div
                  key={entry.meterId}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {entry.meterName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {entry.propertyName}
                      </p>
                    </div>

                    {entry.latestReading && (
                      <div className="text-right text-sm text-slate-600">
                        <p>
                          {entry.latestReading.month}/{entry.latestReading.year}
                        </p>
                        <p>₹ {formatCurrency(Number(entry.latestReading.billAmount))}</p>
                      </div>
                    )}
                  </div>

                  {entry.latestReading && (
                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-slate-600">
                      <Stat label="Prev" value={Number(entry.latestReading.previousReading)} />
                      <Stat label="Current" value={Number(entry.latestReading.currentReading)} />
                      <Stat label="Units" value={Number(entry.latestReading.unitsConsumed)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Recent Readings
          </h2>

          {dashboard.recentReadings.length === 0 ? (
            <p className="text-sm text-slate-500">No recent readings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2 pr-4 font-medium">Meter</th>
                    <th className="py-2 pr-4 font-medium">Period</th>
                    <th className="py-2 pr-4 font-medium">Units</th>
                    <th className="py-2 pr-4 font-medium">Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentReadings.map((reading) => (
                    <tr key={reading.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-900">
                          {reading.meter.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {reading.meter.property.name}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {reading.month}/{reading.year}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {Number(reading.unitsConsumed)}
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        ₹ {formatCurrency(Number(reading.billAmount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

type CardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tone: "slate" | "indigo" | "emerald" | "amber";
};

function Card({ title, value, icon, tone }: CardProps) {
  const toneClasses = {
    slate: "bg-slate-50 text-slate-900 ring-slate-200",
    indigo: "bg-indigo-50 text-indigo-900 ring-indigo-100",
    emerald: "bg-emerald-50 text-emerald-900 ring-emerald-100",
    amber: "bg-amber-50 text-amber-900 ring-amber-100",
  };

  return (
    <div className={`rounded-2xl p-5 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium opacity-80">{title}</h3>

        <div className="rounded-full bg-white/70 p-2 shadow-sm">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        {value}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-10 w-32 animate-pulse rounded bg-slate-200" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}