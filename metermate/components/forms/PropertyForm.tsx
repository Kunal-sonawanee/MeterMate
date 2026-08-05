"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createProperty } from "@/lib/api";

type PropertyFormData = {
  name: string;
  address: string;
};

export default function PropertyForm() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PropertyFormData>();

  async function onSubmit(data: PropertyFormData) {
    try {
      await createProperty(data);

      await queryClient.invalidateQueries({ queryKey: ["properties"] });
      await queryClient.invalidateQueries({ queryKey: ["meters"] });

      toast.success("Property created successfully.");
      reset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create property.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8 rounded-xl bg-white p-6 shadow"
    >
      <h2 className="mb-6 text-xl font-semibold">
        Add Property
      </h2>

      <input
        {...register("name", {
          required: "Property name is required",
        })}
        placeholder="Property Name"
        className="mb-4 w-full rounded border p-3"
      />

      <input
        {...register("address")}
        placeholder="Address"
        className="mb-4 w-full rounded border p-3"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-blue-600 px-6 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isSubmitting ? "Saving..." : "Save Property"}
      </button>
    </form>
  );
}