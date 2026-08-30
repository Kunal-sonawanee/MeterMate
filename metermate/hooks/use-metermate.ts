"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ApiRequestError,
  createMeter,
  createProperty,
  createReading,
  deleteMeter,
  deleteProperty,
  deleteReading,
  getDashboard,
  getMeter,
  getMeters,
  getPrecedingReading,
  getProperties,
  getReadings,
  updateMeter,
  updateProperty,
  updateReading,
  type ReadingsQuery,
} from "@/lib/api";
import type {
  MeterInput,
  PropertyInput,
  ReadingInput,
  ReadingUpdateInput,
} from "@/lib/validation";

/**
 * Server state for the whole product.
 *
 * Query keys live here rather than being spelled out at each call site, so a
 * write can reliably invalidate everything it affects. Reading data feeds the
 * dashboard, the meter list and the history table at once, which is why writes
 * invalidate broadly instead of surgically.
 */

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  properties: ["properties"] as const,
  meters: ["meters"] as const,
  meter: (id: string) => ["meters", id] as const,
  readings: (params: ReadingsQuery = {}) => ["readings", params] as const,
  precedingReading: (meterId: string, month?: number, year?: number) =>
    [
      "meters",
      meterId,
      "preceding-reading",
      month ?? null,
      year ?? null,
    ] as const,
};

/** Anything that changes a reading moves numbers on every screen. */
function invalidateReadingData(client: QueryClient) {
  return Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.dashboard }),
    client.invalidateQueries({ queryKey: queryKeys.meters }),
    client.invalidateQueries({ queryKey: ["readings"] }),
  ]);
}

export function errorMessage(
  error: unknown,
  fallback = "Something went wrong.",
): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/* ----------------------------------------------------------------- queries */

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: getDashboard });
}

export function useProperties() {
  return useQuery({ queryKey: queryKeys.properties, queryFn: getProperties });
}

export function useMeters() {
  return useQuery({ queryKey: queryKeys.meters, queryFn: getMeters });
}

export function useMeter(id: string) {
  return useQuery({
    queryKey: queryKeys.meter(id),
    queryFn: () => getMeter(id),
    enabled: !!id,
  });
}

export function useReadings(params: ReadingsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.readings(params),
    queryFn: () => getReadings(params),
    // Keeps the previous page on screen while a filter change loads, so the
    // table doesn't collapse to a skeleton on every keystroke.
    placeholderData: (previous) => previous,
  });
}

export function usePrecedingReading(
  meterId: string | undefined,
  period: { month: number; year: number } | null,
) {
  return useQuery({
    queryKey: queryKeys.precedingReading(
      meterId ?? "",
      period?.month,
      period?.year,
    ),
    queryFn: () => getPrecedingReading(meterId!, period ?? undefined),
    enabled: Boolean(meterId),
  });
}

/* --------------------------------------------------------------- mutations */

export function useCreateProperty() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: PropertyInput) => createProperty(data),
    onSuccess: async (property) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.properties }),
        client.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
      toast.success(`${property.name} added.`);
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Couldn't add that property.")),
  });
}

export function useUpdateProperty() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PropertyInput> }) =>
      updateProperty(id, data),
    onSuccess: async (property) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.properties }),
        client.invalidateQueries({ queryKey: queryKeys.meters }),
        client.invalidateQueries({ queryKey: ["readings"] }),
      ]);
      toast.success(`${property.name} updated.`);
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Couldn't update that property.")),
  });
}

export function useDeleteProperty() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cascade }: { id: string; cascade?: boolean }) =>
      deleteProperty(id, { cascade }),
    onSuccess: async (result) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.properties }),
        invalidateReadingData(client),
      ]);
      toast.success(result.message);
    },
    // The confirm dialog surfaces the message inline, so no toast here.
  });
}

export function useCreateMeter() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: MeterInput) => createMeter(data),
    onSuccess: async (meter) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.properties }),
        invalidateReadingData(client),
      ]);
      toast.success(`${meter.name} added.`);
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Couldn't add that meter.")),
  });
}

export function useUpdateMeter() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MeterInput> }) =>
      updateMeter(id, data),
    onSuccess: async (meter) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.meter(meter.id) }),
        client.invalidateQueries({ queryKey: queryKeys.properties }),
        invalidateReadingData(client),
      ]);
      toast.success(`${meter.name} updated.`);
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Couldn't update that meter.")),
  });
}

export function useDeleteMeter() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMeter(id),
    onSuccess: async (result) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.properties }),
        invalidateReadingData(client),
      ]);
      toast.success(result.message);
    },
  });
}

export function useCreateReading() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: ReadingInput) => createReading(data),
    onSuccess: async (_reading, variables) => {
      await Promise.all([
        invalidateReadingData(client),
        client.invalidateQueries({
          queryKey: queryKeys.meter(variables.meterId),
        }),
        client.invalidateQueries({
          queryKey: ["meters", variables.meterId, "preceding-reading"],
        }),
      ]);
    },
  });
}

export function useUpdateReading() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ReadingUpdateInput;
      meterId?: string;
    }) => updateReading(id, data),
    onSuccess: async (_reading, variables) => {
      await Promise.all([
        invalidateReadingData(client),
        variables.meterId
          ? client.invalidateQueries({
              queryKey: queryKeys.meter(variables.meterId),
            })
          : Promise.resolve(),
      ]);
    },
  });
}

export function useDeleteReading() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; meterId?: string }) => deleteReading(id),
    onSuccess: async (result, variables) => {
      await Promise.all([
        invalidateReadingData(client),
        variables.meterId
          ? client.invalidateQueries({
              queryKey: queryKeys.meter(variables.meterId),
            })
          : Promise.resolve(),
      ]);
      toast.success(result.message);
    },
  });
}
