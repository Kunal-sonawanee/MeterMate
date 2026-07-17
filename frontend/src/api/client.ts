import type {
  DashboardResponse,
  ErrorResponsePayload,
  MeterRequest,
  MeterResponse,
  ReadingRequest,
  ReadingResponse,
  SettingsRequest,
  SettingsResponse
} from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  payload?: ErrorResponsePayload;

  constructor(status: number, message: string, payload?: ErrorResponsePayload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorResponsePayload | null;
    throw new ApiError(response.status, payload?.message ?? response.statusText, payload ?? undefined);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  getDashboard: () => request<DashboardResponse>('/dashboard'),
  getMeters: () => request<MeterResponse[]>('/meters'),
  getTenantMeters: () => request<MeterResponse[]>('/meters/tenant'),
  getMeter: (id: number) => request<MeterResponse>(`/meters/${id}`),
  createMeter: (payload: MeterRequest) =>
    request<MeterResponse>('/meters', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateMeter: (id: number, payload: MeterRequest) =>
    request<MeterResponse>(`/meters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteMeter: (id: number) =>
    request<void>(`/meters/${id}`, {
      method: 'DELETE'
    }),
  createReading: (payload: ReadingRequest) =>
    request<ReadingResponse>('/readings', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getReadings: () => request<ReadingResponse[]>('/readings'),
  getReadingHistory: (meterId?: number) => {
    const params = meterId ? `?meterId=${meterId}` : '';
    return request<ReadingResponse[]>(`/readings/history${params}`);
  },
  getSettings: () => request<SettingsResponse>('/settings'),
  updateSettings: (payload: SettingsRequest) =>
    request<SettingsResponse>('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
};
