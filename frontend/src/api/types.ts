export type MeterType = 'MAIN' | 'SUB';

export interface DashboardResponse {
  mainMeterUnits: number;
  tenantUnits: number;
  ownerUnits: number;
  totalCollection: number;
}

export interface MeterRequest {
  propertyId: number;
  meterName: string;
  meterType: MeterType;
  tenantName?: string | null;
  phone?: string | null;
}

export interface MeterResponse {
  id: number;
  propertyId: number;
  meterName: string;
  meterType: MeterType;
  tenantName?: string | null;
  phone?: string | null;
  active: boolean;
}

export interface ReadingRequest {
  meterId: number;
  month: number;
  year: number;
  currentReading: number;
}

export interface ReadingResponse {
  id: number;
  meterId: number;
  month: number;
  year: number;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  billAmount: number;
  createdAt: string;
}

export interface SettingsRequest {
  ratePerUnit: number;
  fixedCharge: number;
}

export interface SettingsResponse {
  id: number;
  ratePerUnit: number;
  fixedCharge: number;
}

export interface ErrorResponsePayload {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
