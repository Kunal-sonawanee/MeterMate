"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { createMeter, getProperties } from "@/lib/api";
import { toast } from "sonner";

type Property = {
  id: string;
  name: string;
};

type MeterFormData = {
  name: string;
  meterNumber: string;
  propertyId: string;
};

export default function MeterForm() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<MeterFormData>();

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["properties"],
    queryFn: getProperties,
  });

  async function onSubmit(data: MeterFormData) {
    try {
      await createMeter(data);

      await queryClient.invalidateQueries({ queryKey: ["meters"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["readings"] });

      toast.success("Meter created successfully");

      reset();
    } catch {
      toast.error("Failed to create meter");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8 rounded-xl bg-white p-6 shadow"
    >
      <h2 className="mb-6 text-xl font-semibold">
        Add Meter
      </h2>

      <select
        {...register("propertyId", {
          required: true,
        })}
        className="mb-4 w-full rounded border p-3"
      >
        <option value="">
          Select Property
        </option>

        {properties.map((property) => (
          <option
            key={property.id}
            value={property.id}
          >
            {property.name}
          </option>
        ))}
      </select>

      <input
        {...register("name", {
          required: true,
        })}
        placeholder="Meter Name"
        className="mb-4 w-full rounded border p-3"
      />

      <input
        {...register("meterNumber")}
        placeholder="Meter Number (optional)"
        className="mb-4 w-full rounded border p-3"
      />

      <button
        className="rounded bg-green-600 px-6 py-3 text-white"
      >
        Save Meter
      </button>
    </form>
  );
}