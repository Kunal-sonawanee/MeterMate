import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api/client';
import { ModalSheet } from '../components/ModalSheet';
import type { MeterRequest, MeterResponse, MeterType, SettingsResponse } from '../api/types';
import { formatCurrency } from '../lib/format';

interface SettingsFormState {
  ratePerUnit: string;
  fixedCharge: string;
}

interface MeterFormState {
  propertyId: string;
  meterName: string;
  meterType: MeterType;
  tenantName: string;
  phone: string;
}

const emptyForm: SettingsFormState = {
  ratePerUnit: '',
  fixedCharge: ''
};

const emptyMeterForm: MeterFormState = {
  propertyId: '1',
  meterName: '',
  meterType: 'SUB',
  tenantName: '',
  phone: ''
};

function toMeterRequest(form: MeterFormState): MeterRequest {
  return {
    propertyId: Number(form.propertyId),
    meterName: form.meterName.trim(),
    meterType: form.meterType,
    tenantName: form.tenantName.trim() || null,
    phone: form.phone.trim() || null
  };
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [meters, setMeters] = useState<MeterResponse[]>([]);
  const [form, setForm] = useState<SettingsFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meterSaving, setMeterSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [meterFieldError, setMeterFieldError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMeterId, setEditingMeterId] = useState<number | null>(null);
  const [meterForm, setMeterForm] = useState<MeterFormState>(emptyMeterForm);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [settingsData, metersData] = await Promise.all([api.getSettings(), api.getMeters()]);
        if (!active) {
          return;
        }

        setSettings(settingsData);
        setMeters(metersData);
        setForm({
          ratePerUnit: String(settingsData.ratePerUnit),
          fixedCharge: String(settingsData.fixedCharge)
        });
      } catch (cause) {
        if (active) {
          setError(cause instanceof ApiError ? cause.message : 'Unable to load settings.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const preview = useMemo(() => {
    const rate = Number(form.ratePerUnit);
    const fixed = Number(form.fixedCharge);

    if (!form.ratePerUnit || Number.isNaN(rate) || !form.fixedCharge || Number.isNaN(fixed)) {
      return null;
    }

    return rate * 100 + fixed;
  }, [form.fixedCharge, form.ratePerUnit]);

  const hasMainMeter = meters.some((meter) => meter.meterType === 'MAIN');
  const editingMeter = useMemo(() => meters.find((meter) => meter.id === editingMeterId) ?? null, [editingMeterId, meters]);

  async function refreshMeters() {
    try {
      const data = await api.getMeters();
      setMeters(data);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to load meters.');
    }
  }

  function openCreateMeter() {
    setMeterFieldError(null);
    setEditingMeterId(null);
    setMeterForm({
      ...emptyMeterForm,
      meterType: hasMainMeter ? 'SUB' : 'MAIN'
    });
    setSheetOpen(true);
  }

  function openEditMeter(meter: MeterResponse) {
    setMeterFieldError(null);
    setEditingMeterId(meter.id);
    setMeterForm({
      propertyId: String(meter.propertyId),
      meterName: meter.meterName,
      meterType: meter.meterType,
      tenantName: meter.tenantName ?? '',
      phone: meter.phone ?? ''
    });
    setSheetOpen(true);
  }

  async function saveMeter() {
    setMeterFieldError(null);
    setNotice(null);

    const meterName = meterForm.meterName.trim();
    if (!meterName) {
      setMeterFieldError('Meter name is required.');
      return;
    }

    if (meterForm.phone.trim().length > 20) {
      setMeterFieldError('Phone must be 20 characters or less.');
      return;
    }

    const duplicate = meters.some((meter) => {
      if (meter.id === editingMeterId) {
        return false;
      }

      return meter.meterName.trim().toLowerCase() === meterName.toLowerCase();
    });

    if (duplicate) {
      setMeterFieldError('Meter name must be unique.');
      return;
    }

    if (meterForm.meterType === 'MAIN' && hasMainMeter && editingMeter?.meterType !== 'MAIN') {
      setMeterFieldError('Only one MAIN meter is allowed per property.');
      return;
    }

    try {
      setMeterSaving(true);
      setError(null);
      const payload = toMeterRequest(meterForm);
      if (editingMeterId) {
        await api.updateMeter(editingMeterId, payload);
        setNotice('Meter updated.');
      } else {
        await api.createMeter(payload);
        setNotice('Meter added.');
      }
      setSheetOpen(false);
      await refreshMeters();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to save meter.');
    } finally {
      setMeterSaving(false);
    }
  }

  async function deleteMeter(meter: MeterResponse) {
    const confirmed = window.confirm(`Delete ${meter.meterName}?`);
    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setNotice(null);
      await api.deleteMeter(meter.id);
      setNotice('Meter deleted.');
      await refreshMeters();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to delete meter.');
    }
  }

  async function handleSave() {
    setFieldError(null);
    setNotice(null);

    const rate = Number(form.ratePerUnit);
    const fixed = Number(form.fixedCharge);

    if (!form.ratePerUnit.trim() || Number.isNaN(rate) || rate <= 0) {
      setFieldError('Rate per unit must be greater than 0.');
      return;
    }

    if (!form.fixedCharge.trim() || Number.isNaN(fixed) || fixed < 0) {
      setFieldError('Fixed charge must be zero or greater.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await api.updateSettings({ ratePerUnit: rate, fixedCharge: fixed });
      setSettings(updated);
      setNotice('Settings saved successfully.');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <header className="page-hero">
        <div className="eyebrow">Settings</div>
        <h2 className="hero-title">Meters and billing setup.</h2>
        <p className="hero-copy">Add or edit meters, and update rate per unit with fixed charge from one simple page.</p>
      </header>

      {loading ? <div className="loading-surface">Loading settings…</div> : null}
      {error ? <div className="alert">{error}</div> : null}
      {notice ? <div className="alert alert-success">{notice}</div> : null}
      {fieldError ? <div className="alert">{fieldError}</div> : null}

      <div className="grid split-grid">
        <article className="form-card">
          <div className="inline-stack">
            <p className="card-title">Billing settings</p>
            <p className="muted">These are validated in the UI and enforced again by the backend.</p>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="rate-per-unit">Rate per unit</label>
              <input
                id="rate-per-unit"
                value={form.ratePerUnit}
                onChange={(event) => setForm((current) => ({ ...current, ratePerUnit: event.target.value }))}
                inputMode="decimal"
                placeholder="7.5"
              />
            </div>

            <div className="field">
              <label htmlFor="fixed-charge">Fixed charge</label>
              <input
                id="fixed-charge"
                value={form.fixedCharge}
                onChange={(event) => setForm((current) => ({ ...current, fixedCharge: event.target.value }))}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="button button-secondary" onClick={() => settings && setForm({ ratePerUnit: String(settings.ratePerUnit), fixedCharge: String(settings.fixedCharge) })}>
              Reset
            </button>
            <button type="button" className="button button-primary" onClick={() => void handleSave()} disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </article>

        <article className="form-card">
          <div className="inline-stack">
            <p className="card-title">Meter management</p>
            <p className="muted">Create, edit, and remove meters here.</p>
          </div>

          <div className="inline-actions">
            <button type="button" className="button button-primary" onClick={openCreateMeter}>
              Add meter
            </button>
            <button type="button" className="button button-secondary" onClick={() => void refreshMeters()}>
              Refresh meters
            </button>
          </div>

          <div className="grid" style={{ marginTop: 8 }}>
            {meters.map((meter) => (
              <article key={meter.id} className="meter-card">
                <div className="meter-card-header">
                  <div className="inline-stack">
                    <p className="card-title">{meter.meterName}</p>
                    <p className="muted">Tenant: {meter.tenantName?.trim() || 'Not set'}</p>
                  </div>
                  <span className={`pill ${meter.meterType === 'MAIN' ? 'pill-main' : 'pill-sub'}`}>{meter.meterType}</span>
                </div>

                <p className="muted">Phone: {meter.phone?.trim() || 'Not set'}</p>

                <div className="inline-actions">
                  <button type="button" className="button button-secondary" onClick={() => openEditMeter(meter)}>
                    Edit
                  </button>
                  <button type="button" className="button button-danger" onClick={() => void deleteMeter(meter)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}

            {meters.length === 0 ? (
              <div className="panel">
                <h3 className="panel-title">No meters found</h3>
                <p className="muted">Use Add meter to create your first meter.</p>
              </div>
            ) : null}
          </div>
        </article>
      </div>

      <section className="panel">
        <h3 className="panel-title">Billing preview</h3>
        <p className="muted">
          {preview == null ? 'Enter both fields to see an example for 100 units.' : `A 100 unit bill will be ₹${formatCurrency(preview)}.`}
        </p>
      </section>

      <ModalSheet
        open={sheetOpen}
        title={editingMeter ? `Edit ${editingMeter.meterName}` : 'Add meter'}
        description="Keep one MAIN meter and unique meter names within the property."
        onClose={() => {
          if (!meterSaving) {
            setSheetOpen(false);
          }
        }}
        footer={
          <>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                if (!meterSaving) {
                  setSheetOpen(false);
                }
              }}
              disabled={meterSaving}
            >
              Cancel
            </button>
            <button type="button" className="button button-primary" onClick={() => void saveMeter()} disabled={meterSaving}>
              {meterSaving ? 'Saving...' : 'Save meter'}
            </button>
          </>
        }
      >
        <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
          {meterFieldError ? <div className="alert">{meterFieldError}</div> : null}

          <div className="field">
            <label htmlFor="meter-property">Property ID</label>
            <input
              id="meter-property"
              value={meterForm.propertyId}
              onChange={(event) => setMeterForm((current) => ({ ...current, propertyId: event.target.value }))}
              inputMode="numeric"
            />
          </div>

          <div className="field">
            <label htmlFor="meter-name">Meter name</label>
            <input
              id="meter-name"
              value={meterForm.meterName}
              onChange={(event) => setMeterForm((current) => ({ ...current, meterName: event.target.value }))}
              maxLength={150}
            />
          </div>

          <div className="field">
            <label htmlFor="meter-type">Meter type</label>
            <select
              id="meter-type"
              value={meterForm.meterType}
              onChange={(event) => setMeterForm((current) => ({ ...current, meterType: event.target.value as MeterType }))}
            >
              <option value="SUB">SUB</option>
              <option value="MAIN" disabled={hasMainMeter && editingMeter?.meterType !== 'MAIN'}>
                MAIN
              </option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="tenant-name">Tenant name</label>
            <input
              id="tenant-name"
              value={meterForm.tenantName}
              onChange={(event) => setMeterForm((current) => ({ ...current, tenantName: event.target.value }))}
              maxLength={150}
            />
          </div>

          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              value={meterForm.phone}
              onChange={(event) => setMeterForm((current) => ({ ...current, phone: event.target.value }))}
              maxLength={20}
            />
          </div>
        </form>
      </ModalSheet>
    </section>
  );
}
