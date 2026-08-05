"use client";

import { useMemo, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  deleteReading,
  getMeters,
  getReadings,
  updateReading,
  type ReadingSummary,
} from "@/lib/api";
import { toast } from "sonner";

type ReadingFilter = {
  meterId: string;
  period: string;
};

type ReadingEditState = {
  id: string;
  meterName: string;
  readingMonth: string;
  currentReading: string;
  ratePerUnit: string;
};

type ApiError = {
  message?: string;
  code?: string;
  status?: number;
};

export default function ReadingTable() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReadingFilter>({
    meterId: "",
    period: "",
  });
  const [editingReading, setEditingReading] = useState<ReadingEditState | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: readings = [], isLoading } = useQuery<ReadingSummary[]>({
    queryKey: ["readings"],
    queryFn: getReadings,
  });

  const { data: meters = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["meters"],
    queryFn: getMeters,
  });

  const filteredReadings = useMemo(() => {
    return readings.filter((reading) => {
      const matchesMeter =
        !filters.meterId || reading.meter.id === filters.meterId;
      const matchesPeriod =
        !filters.period || `${reading.year}-${String(reading.month).padStart(2, "0")}` === filters.period;

      return matchesMeter && matchesPeriod;
    });
  }, [filters.meterId, filters.period, readings]);

  async function handleDelete(id: string) {
    try {
      await deleteReading(id);

      await queryClient.invalidateQueries({ queryKey: ["readings"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success("Reading deleted successfully");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete reading");
    }
  }

  function openEditModal(reading: ReadingSummary) {
    setEditingReading({
      id: reading.id,
      meterName: reading.meter.name,
      readingMonth: `${reading.year}-${String(reading.month).padStart(2, "0")}`,
      currentReading: String(Number(reading.currentReading)),
      ratePerUnit: String(Number(reading.ratePerUnit)),
    });
  }

  async function handleSaveEdit() {
    if (!editingReading) {
      return;
    }

    const [yearText, monthText] = editingReading.readingMonth.split("-");

    try {
      setSaving(true);

      await updateReading(editingReading.id, {
        month: Number(monthText),
        year: Number(yearText),
        currentReading: Number(editingReading.currentReading),
        ratePerUnit: Number(editingReading.ratePerUnit),
      });

      await queryClient.invalidateQueries({ queryKey: ["readings"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success("Reading updated successfully");
      setEditingReading(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update reading");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="mb-6 text-xl font-semibold">Reading History</h2>
        <p className="text-sm text-slate-500">Loading readings...</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Reading History
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Filter by meter or billing period to find a reading quickly.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-700">Meter</span>
            <select
              value={filters.meterId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  meterId: event.target.value,
                }))
              }
              className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-slate-900"
            >
              <option value="">All meters</option>
              {meters.map((meter) => (
                <option key={meter.id} value={meter.id}>
                  {meter.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-700">Period</span>
            <input
              type="month"
              value={filters.period}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  period: event.target.value,
                }))
              }
              className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-slate-900"
            />
          </label>
        </div>
      </div>

      {filteredReadings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-900">No readings found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a different meter or period filter.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">Meter</th>
                  <th className="px-3 py-3 font-medium">Period</th>
                  <th className="px-3 py-3 font-medium">Previous</th>
                  <th className="px-3 py-3 font-medium">Current</th>
                  <th className="px-3 py-3 font-medium">Units</th>
                  <th className="px-3 py-3 font-medium">Rate</th>
                  <th className="px-3 py-3 font-medium">Bill</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReadings.map((reading) => (
                  <tr key={reading.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-4">
                      <p className="font-medium text-slate-900">{reading.meter.name}</p>
                      <p className="text-xs text-slate-500">
                        {reading.meter.property.name}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-slate-600">
                      {reading.month}/{reading.year}
                    </td>
                    <td className="px-3 py-4 text-slate-600">{Number(reading.previousReading)}</td>
                    <td className="px-3 py-4 text-slate-600">{Number(reading.currentReading)}</td>
                    <td className="px-3 py-4 text-slate-600">{Number(reading.unitsConsumed)}</td>
                    <td className="px-3 py-4 text-slate-600">₹ {Number(reading.ratePerUnit).toLocaleString("en-IN")}</td>
                    <td className="px-3 py-4 font-medium text-slate-900">₹ {Number(reading.billAmount).toLocaleString("en-IN")}</td>
                    <td className="px-3 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(reading)}
                          className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(reading.id)}
                          className="rounded-md border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:hidden">
            {filteredReadings.map((reading) => (
              <article key={reading.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{reading.meter.name}</p>
                    <p className="text-xs text-slate-500">{reading.meter.property.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {reading.month}/{reading.year}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditModal(reading)}
                    className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(reading.id)}
                    className="rounded-md border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Info label="Previous" value={Number(reading.previousReading)} />
                  <Info label="Current" value={Number(reading.currentReading)} />
                  <Info label="Units" value={Number(reading.unitsConsumed)} />
                  <Info label="Rate" value={`₹ ${Number(reading.ratePerUnit).toLocaleString("en-IN")}`} />
                </div>

                <div className="mt-4 rounded-lg bg-white px-3 py-3 text-sm font-medium text-slate-900">
                  Bill Amount: ₹ {Number(reading.billAmount).toLocaleString("en-IN")}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {editingReading && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Edit Monthly Reading</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {editingReading.meterName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingReading(null)}
                className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-700">Billing Month</span>
                <input
                  type="month"
                  value={editingReading.readingMonth}
                  onChange={(event) =>
                    setEditingReading((current) =>
                      current ? { ...current, readingMonth: event.target.value } : current
                    )
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-700">Current Reading</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter current reading"
                  value={editingReading.currentReading}
                  onChange={(event) =>
                    setEditingReading((current) =>
                      current ? { ...current, currentReading: event.target.value } : current
                    )
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-700">Rate Per Unit</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter rate per unit"
                  value={editingReading.ratePerUnit}
                  onChange={(event) =>
                    setEditingReading((current) =>
                      current ? { ...current, ratePerUnit: event.target.value } : current
                    )
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingReading(null)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}