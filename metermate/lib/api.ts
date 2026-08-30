import type {
  ApiErrorBody,
  DashboardResponse,
  MeterDetail,
  MeterSummary,
  PreviousReadingResponse,
  PropertySummary,
  Reading,
  ReadingsResponse,
} from "@/lib/types";
import type {
  MeterInput,
  PropertyInput,
  ReadingInput,
  ReadingUpdateInput,
} from "@/lib/validation";

/**
 * Browser-side API client.
 *
 * Every call resolves to typed data or throws an `ApiRequestError` carrying the
 * status, the message the server wrote for the user, and any per-field errors —
 * which is what lets forms highlight the offending input instead of only
 * showing a toast.
 */

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }

  /** A dropped connection or an offline device, rather than a rejected request. */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

const OFFLINE_MESSAGE =
  "Can't reach the server. Check your connection and try again.";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: init?.body
        ? { "Content-Type": "application/json", ...init?.headers }
        : init?.headers,
    });
  } catch {
    throw new ApiRequestError(0, OFFLINE_MESSAGE);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => null)) as
    | ApiErrorBody
    | T
    | null;

  if (!response.ok) {
    const error = (body ?? {}) as ApiErrorBody;
    throw new ApiRequestError(
      response.status,
      error.message || "Something went wrong. Please try again.",
      error.fields,
    );
  }

  return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
};

/* -------------------------------------------------------------- dashboard */

export const getDashboard = () => request<DashboardResponse>("/dashboard");

/* ------------------------------------------------------------- properties */

export const getProperties = () => request<PropertySummary[]>("/properties");

export const createProperty = (data: PropertyInput) =>
  request<PropertySummary>("/properties", { method: "POST", body: json(data) });

export const updateProperty = (id: string, data: Partial<PropertyInput>) =>
  request<PropertySummary>(`/properties/${id}`, {
    method: "PATCH",
    body: json(data),
  });

export const deleteProperty = (id: string, options?: { cascade?: boolean }) =>
  request<{ message: string }>(
    `/properties/${id}${options?.cascade ? "?cascade=true" : ""}`,
    { method: "DELETE" },
  );

/* ----------------------------------------------------------------- meters */

export const getMeters = () => request<MeterSummary[]>("/meters");

export const getMeter = (id: string) => request<MeterDetail>(`/meters/${id}`);

export const createMeter = (data: MeterInput) =>
  request<MeterSummary>("/meters", { method: "POST", body: json(data) });

export const updateMeter = (id: string, data: Partial<MeterInput>) =>
  request<MeterSummary>(`/meters/${id}`, { method: "PATCH", body: json(data) });

export const deleteMeter = (id: string) =>
  request<{ message: string }>(`/meters/${id}`, { method: "DELETE" });

export const getPrecedingReading = (
  meterId: string,
  period?: { month: number; year: number },
) =>
  request<PreviousReadingResponse>(
    `/meters/${meterId}/latest-reading${query({ month: period?.month, year: period?.year })}`,
  );

/* --------------------------------------------------------------- readings */

export type ReadingsQuery = {
  meterId?: string;
  propertyId?: string;
  month?: number;
  year?: number;
  limit?: number;
  offset?: number;
};

export const getReadings = (params: ReadingsQuery = {}) =>
  request<ReadingsResponse>(`/readings${query(params)}`);

export const createReading = (data: ReadingInput) =>
  request<Reading>("/readings", { method: "POST", body: json(data) });

export const updateReading = (id: string, data: ReadingUpdateInput) =>
  request<Reading>(`/readings/${id}`, { method: "PATCH", body: json(data) });

export const deleteReading = (id: string) =>
  request<{ message: string }>(`/readings/${id}`, { method: "DELETE" });
