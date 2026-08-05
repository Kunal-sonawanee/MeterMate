const BASE_URL = "/api";

export type DashboardResponse = {
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

export type PropertySummary = {
  id: string;
  name: string;
};

export type MeterSummary = {
  id: string;
  name: string;
};

export type MeterDetail = {
  id: string;
  name: string;
  meterNumber: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    name: string;
  };
  readings: Array<{
    id: string;
    month: number;
    year: number;
    currentReading: string;
    previousReading: string;
    unitsConsumed: string;
    ratePerUnit: string;
    billAmount: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type ReadingSummary = {
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
};

export type CreateReadingInput = {
  meterId: string;
  month: number;
  year: number;
  currentReading: number;
  ratePerUnit: number;
  readingMonth?: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const payload = await response.json().catch(() => null);

    throw new Error(payload?.message || "Request failed");
  }

  return response.json();
}

// Dashboard
export async function getDashboard() {
  return requestJson<DashboardResponse>(`${BASE_URL}/dashboard`);
}

// Property
export async function getProperties() {
  return requestJson<PropertySummary[]>(`${BASE_URL}/properties`);
}

export async function createProperty(data: {
  name: string;
  address: string;
}) {
  return requestJson(`${BASE_URL}/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

// Meter
export async function getMeters() {
  return requestJson<MeterSummary[]>(`${BASE_URL}/meters`);
}

export async function getMeterDetails() {
  return requestJson<MeterDetail[]>(`${BASE_URL}/meters`);
}

export async function createMeter(data: {
  name: string;
  meterNumber?: string;
  propertyId: string;
}) {
  return requestJson(`${BASE_URL}/meters`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

// Reading
export async function getReadings() {
  return requestJson<ReadingSummary[]>(`${BASE_URL}/readings`);
}

export async function createReading(data: CreateReadingInput) {
  return requestJson("/api/readings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updateReading(
  id: string,
  data: Record<string, unknown>
) {
  return requestJson(`${BASE_URL}/readings/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function deleteReading(id: string) {
  return requestJson(`${BASE_URL}/readings/${id}`, {
    method: "DELETE",
  });
}