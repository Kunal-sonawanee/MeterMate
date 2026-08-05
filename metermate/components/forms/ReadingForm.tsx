"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { BadgeIndianRupee, Gauge } from "lucide-react";
import { createReading, getMeters } from "@/lib/api";
import { toast } from "sonner";

type Meter = {
  id: string;
  name: string;
};

type ReadingFormData = {
  meterId: string;
  readingMonth: string;
  currentReading: number;
  ratePerUnit: number;
};

export default function ReadingForm() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
  } = useForm<ReadingFormData>({
    defaultValues: {
      readingMonth: new Date().toISOString().slice(0, 7),
      ratePerUnit: 10,
    },
  });

  const selectedMeter = useWatch({ control, name: "meterId" });
  const currentReadingValue = useWatch({ control, name: "currentReading" });
  const ratePerUnitValue = useWatch({ control, name: "ratePerUnit" });

  const { data: meters = [] } = useQuery<Meter[]>({
    queryKey: ["meters"],
    queryFn: getMeters,
  });

  const { data: previousReading = 0 } = useQuery({
    queryKey: ["meters", selectedMeter, "latest-reading"],
    queryFn: async () => {
      if (!selectedMeter) {
        return 0;
      }

      const response = await fetch(
        `/api/meters/${selectedMeter}/latest-reading`
      );

      if (!response.ok) {
        throw new Error("Failed to load latest reading");
      }

      const data = await response.json();

      return data.previousReading ?? 0;
    },
    enabled: Boolean(selectedMeter),
  });

  async function onSubmit(data: ReadingFormData) {
    const [yearText, monthText] = data.readingMonth.split("-");

    try {
      await createReading({
        ...data,
        month: Number(monthText),
        year: Number(yearText),
      });

      await queryClient.invalidateQueries({ queryKey: ["readings"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["meters"] });

      toast.success("Reading saved successfully");

      reset({
        readingMonth: new Date().toISOString().slice(0, 7),
        ratePerUnit: 10,
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save reading");
    }
  }

  const unitsConsumedPreview = Math.max(
    0,
    Number.isFinite(currentReadingValue)
      ? Number(currentReadingValue) - Number(previousReading)
      : 0
  );

  const estimatedBillPreview =
    unitsConsumedPreview * (Number.isFinite(ratePerUnitValue) ? Number(ratePerUnitValue) : 0);

  return (
    <form
      id="reading-form"
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Add Monthly Reading
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a meter, choose the billing month, then enter the current reading.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Meter</span>
          <select
            {...register("meterId", { required: true })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-slate-900"
          >
            <option value="">Select a meter</option>
            {meters.map((meter) => (
              <option key={meter.id} value={meter.id}>
                {meter.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Billing Month</span>
          <input
            type="month"
            {...register("readingMonth", { required: true })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-slate-900"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Previous Reading</span>
          <input
            type="text"
            value={previousReading}
            readOnly
            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-3 text-slate-700"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Current Reading</span>
          <input
            type="number"
            min="0"
            placeholder="Enter current reading"
            {...register("currentReading", {
              required: true,
              valueAsNumber: true,
            })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-slate-900"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Rate Per Unit</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter rate per unit"
            {...register("ratePerUnit", {
              required: true,
              valueAsNumber: true,
            })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-slate-900"
          />
        </label>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Gauge className="h-4 w-4 text-slate-900" />
            Units Consumed
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{unitsConsumedPreview}</p>
        </div>

        <div className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-100">
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
            <BadgeIndianRupee className="h-4 w-4" />
            Estimated Bill
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            ₹ {estimatedBillPreview.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Previous reading is loaded from the backend for the selected meter.
        </p>

        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Save Reading
        </button>
      </div>
    </form>
  );
}