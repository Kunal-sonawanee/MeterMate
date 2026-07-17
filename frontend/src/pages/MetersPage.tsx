import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { MeterRequest, MeterResponse, MeterType } from '../api/types';
import { ModalSheet } from '../components/ModalSheet';
import { formatNumber } from '../lib/format';

interface MeterFormState {
  propertyId: string;
  meterName: string;
  meterType: MeterType;
  tenantName: string;
  phone: string;
}

const emptyForm: MeterFormState = {
  propertyId: '1',
  meterName: '',
  meterType: 'SUB',
  tenantName: '',
  phone: ''
};

function toRequest(form: MeterFormState): MeterRequest {
  return {
    propertyId: Number(form.propertyId),
    meterName: form.meterName.trim(),
    meterType: form.meterType,
    tenantName: form.tenantName.trim() || null,
    phone: form.phone.trim() || null
  };
}

export function MetersPage() {
  const [meters, setMeters] = useState<MeterResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMeterId, setEditingMeterId] = useState<number | null>(null);
  const [form, setForm] = useState<MeterFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof MeterFormState, string>>>({});

  const editingMeter = useMemo(
    () => meters.find((meter) => meter.id === editingMeterId) ?? null,
    [editingMeterId, meters]
  );
  const hasMainMeter = meters.some((meter) => meter.meterType === 'MAIN');
  const mainMeterCount = meters.filter((meter) => meter.meterType === 'MAIN').length;

  async function loadMeters() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMeters();
      setMeters(data);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to load meters.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMeters();
  }, []);

  function openCreate() {
    setForm({
      ...emptyForm,
      meterType: hasMainMeter ? 'SUB' : 'MAIN'
    });
    setEditingMeterId(null);
    setFormErrors({});
    setNotice(null);
    setSheetOpen(true);
  }

  function openEdit(meter: MeterResponse) {
    setForm({
      propertyId: String(meter.propertyId),
      meterName: meter.meterName,
      meterType: meter.meterType,
      tenantName: meter.tenantName ?? '',
      phone: meter.phone ?? ''
    });
    setEditingMeterId(meter.id);
    setFormErrors({});
    setNotice(null);
    setSheetOpen(true);
  }

  function closeSheet() {
    if (saving) {
      return;
    }

    setSheetOpen(false);
  }

  function validateForm() {
    const nextErrors: Partial<Record<keyof MeterFormState, string>> = {};
    const trimmedName = form.meterName.trim();
    const trimmedPhone = form.phone.trim();

    if (!form.propertyId.trim() || Number.isNaN(Number(form.propertyId))) {
      nextErrors.propertyId = 'Property ID is required.';
    }

    if (!trimmedName) {
      nextErrors.meterName = 'Meter name is required.';
    } else {
      const duplicate = meters.some((meter) => {
        if (meter.id === editingMeterId) {
          return false;
        }

        return meter.meterName.trim().toLowerCase() === trimmedName.toLowerCase();
      });

      if (duplicate) {
        nextErrors.meterName = 'Meter names must be unique within a property.';
      }
    }

    if (!form.meterType) {
      nextErrors.meterType = 'Meter type is required.';
    }

    if (trimmedPhone.length > 20) {
      nextErrors.phone = 'Phone must be 20 characters or less.';
    }

    if (form.meterType === 'MAIN' && hasMainMeter && editingMeter?.meterType !== 'MAIN') {
      nextErrors.meterType = 'Only one MAIN meter is allowed per property.';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function saveMeter() {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const payload = toRequest(form);
      if (editingMeterId) {
        await api.updateMeter(editingMeterId, payload);
        setNotice('Meter updated successfully.');
      } else {
        await api.createMeter(payload);
        setNotice('Meter added successfully.');
      }
      setSheetOpen(false);
      await loadMeters();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to save meter.');
    } finally {
      setSaving(false);
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
      await loadMeters();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to delete meter.');
    }
  }

  const activeCount = meters.filter((meter) => meter.active).length;

  return (
    <section className="page">
      <header className="page-hero">
        <div className="eyebrow">Meters</div>
        <h2 className="hero-title">Manage the property meter list.</h2>
        <p className="hero-copy">
          Add or edit main and sub meters, keep names unique, and protect the single MAIN meter rule directly in the UI.
        </p>
        <div className="hero-actions">
          <button type="button" className="button button-primary" onClick={openCreate}>
            Add meter
          </button>
          <span className="chip">{formatNumber(activeCount)} active</span>
          <span className="chip">{formatNumber(mainMeterCount)} main</span>
        </div>
      </header>

      <div className="toolbar">
        <p className="muted">Property ID is fixed to 1 for the current backend build. Meter names stay unique per property.</p>
        <button type="button" className="button button-secondary" onClick={loadMeters} disabled={loading}>
          Refresh list
        </button>
      </div>

      {loading ? <div className="loading-surface">Loading meters…</div> : null}

      {error ? <div className="alert">{error}</div> : null}
      {notice ? <div className="alert alert-success">{notice}</div> : null}

      {!loading && meters.length === 0 ? (
        <div className="panel">
          <h3 className="panel-title">No meters yet</h3>
          <p className="muted">Start with the seeded property and add the first meter from the action above.</p>
        </div>
      ) : null}

      <div className="grid list-grid">
        {meters.map((meter) => (
          <article key={meter.id} className="meter-card">
            <div className="meter-card-header">
              <div className="inline-stack">
                <p className="card-title">{meter.meterName}</p>
                <p className="muted">Property {meter.propertyId}</p>
              </div>
              <div className="card-meta">
                <span className={`pill ${meter.meterType === 'MAIN' ? 'pill-main' : 'pill-sub'}`}>{meter.meterType}</span>
                <span className={`pill ${meter.active ? 'pill-active' : 'pill-muted'}`}>{meter.active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>

            <div className="summary-row">
              <div className="kpi">
                <p className="kpi-label">Tenant</p>
                <p className="kpi-value" style={{ fontSize: '1rem' }}>
                  {meter.tenantName?.trim() || '—'}
                </p>
              </div>
              <div className="kpi">
                <p className="kpi-label">Phone</p>
                <p className="kpi-value" style={{ fontSize: '1rem' }}>
                  {meter.phone?.trim() || '—'}
                </p>
              </div>
            </div>

            <div className="inline-actions">
              <button type="button" className="button button-secondary" onClick={() => openEdit(meter)}>
                Edit
              </button>
              <button type="button" className="button button-danger" onClick={() => void deleteMeter(meter)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <ModalSheet
        open={sheetOpen}
        title={editingMeter ? `Edit ${editingMeter.meterName}` : 'Add meter'}
        description="Create a meter, keep names unique, and respect the seeded property setup."
        onClose={closeSheet}
        footer={
          <>
            <button type="button" className="button button-secondary" onClick={closeSheet} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="button button-primary" onClick={() => void saveMeter()} disabled={saving}>
              {saving ? 'Saving…' : 'Save meter'}
            </button>
          </>
        }
      >
        <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
          <div className="field">
            <label htmlFor="meter-property">Property ID</label>
            <input
              id="meter-property"
              value={form.propertyId}
              onChange={(event) => setForm((current) => ({ ...current, propertyId: event.target.value }))}
              inputMode="numeric"
            />
            {formErrors.propertyId ? <p className="field-error">{formErrors.propertyId}</p> : <p className="helper">Locked to 1 until property management is added.</p>}
          </div>

          <div className="field">
            <label htmlFor="meter-name">Meter name</label>
            <input
              id="meter-name"
              value={form.meterName}
              onChange={(event) => setForm((current) => ({ ...current, meterName: event.target.value }))}
              maxLength={150}
              placeholder="Room 4"
            />
            {formErrors.meterName ? <p className="field-error">{formErrors.meterName}</p> : null}
          </div>

          <div className="field">
            <label htmlFor="meter-type">Meter type</label>
            <select
              id="meter-type"
              value={form.meterType}
              onChange={(event) => setForm((current) => ({ ...current, meterType: event.target.value as MeterType }))}
            >
              <option value="SUB">SUB</option>
              <option value="MAIN" disabled={hasMainMeter && editingMeter?.meterType !== 'MAIN'}>
                MAIN{hasMainMeter && editingMeter?.meterType !== 'MAIN' ? ' - already in use' : ''}
              </option>
            </select>
            {formErrors.meterType ? <p className="field-error">{formErrors.meterType}</p> : <p className="helper">Only one MAIN meter can exist per property.</p>}
          </div>

          <div className="field">
            <label htmlFor="tenant-name">Tenant name</label>
            <input
              id="tenant-name"
              value={form.tenantName}
              onChange={(event) => setForm((current) => ({ ...current, tenantName: event.target.value }))}
              maxLength={150}
              placeholder="Asha"
            />
          </div>

          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              maxLength={20}
              placeholder="9876543210"
            />
            {formErrors.phone ? <p className="field-error">{formErrors.phone}</p> : null}
          </div>
        </form>
      </ModalSheet>
    </section>
  );
}
