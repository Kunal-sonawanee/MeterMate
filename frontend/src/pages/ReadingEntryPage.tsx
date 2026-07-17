import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { MeterResponse, ReadingResponse, SettingsResponse } from '../api/types';
import { formatCurrency, formatReading, monthName, readingPeriodLabel, sortReadingsDesc } from '../lib/format';

const currentDate = new Date();

interface ReadingFormState {
  meterId: string;
  month: string;
  year: string;
  currentReading: string;
}

const emptyForm: ReadingFormState = {
  meterId: '',
  month: String(currentDate.getMonth() + 1),
  year: String(currentDate.getFullYear()),
  currentReading: ''
};

function toNumber(value: string) {
  return Number(value);
}

export function ReadingEntryPage() {
  const [meters, setMeters] = useState<MeterResponse[]>([]);
  const [history, setHistory] = useState<ReadingResponse[]>([]);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [selectedMeterId, setSelectedMeterId] = useState<number | null>(null);
  const [form, setForm] = useState<ReadingFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        setLoading(true);
        setError(null);
        const [meterData, settingsData] = await Promise.all([api.getMeters(), api.getSettings()]);
        if (!active) {
          return;
        }

        setMeters(meterData);
        setSettings(settingsData);
        setSelectedMeterId((current) => current ?? meterData[0]?.id ?? null);
        setForm((current) => ({
          ...current,
          meterId: current.meterId || String(meterData[0]?.id ?? ''),
          currentReading: current.currentReading
        }));
      } catch (cause) {
        if (active) {
          setError(cause instanceof ApiError ? cause.message : 'Unable to load reading form.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedMeterId) {
      setHistory([]);
      return;
    }

    let active = true;

    async function loadHistory() {
      try {
        setHistoryLoading(true);
        const data = await api.getReadingHistory(selectedMeterId ?? undefined);
        if (active) {
          setHistory(data);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof ApiError ? cause.message : 'Unable to load meter history.');
        }
      } finally {
        if (active) {
          setHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [selectedMeterId]);

  const selectedMeter = useMemo(
    () => meters.find((meter) => meter.id === selectedMeterId) ?? null,
    [meters, selectedMeterId]
  );

  const sortedHistory = useMemo(() => sortReadingsDesc(history), [history]);
  const latestReading = sortedHistory[0] ?? null;
  const latestPreviousReading = latestReading?.currentReading ?? null;
  const currentReadingValue = form.currentReading ? Number(form.currentReading) : null;
  const meterRate = settings?.ratePerUnit ?? 0;
  const fixedCharge = settings?.fixedCharge ?? 0;
  const estimatedBill =
    currentReadingValue != null && latestPreviousReading != null && currentReadingValue >= latestPreviousReading
      ? (currentReadingValue - latestPreviousReading) * meterRate + fixedCharge
      : null;
  const isLowerThanPrevious =
    currentReadingValue != null && latestPreviousReading != null ? currentReadingValue < latestPreviousReading : false;

  async function handleSubmit() {
    setFieldError(null);
    setNotice(null);

    if (!selectedMeterId) {
      setFieldError('Choose a meter before saving.');
      return;
    }

    if (!form.month || Number(form.month) < 1 || Number(form.month) > 12) {
      setFieldError('Month must be between 1 and 12.');
      return;
    }

    if (!form.year.trim()) {
      setFieldError('Year is required.');
      return;
    }

    if (!form.currentReading.trim() || Number.isNaN(Number(form.currentReading))) {
      setFieldError('Current reading must be numeric.');
      return;
    }

    if (isLowerThanPrevious) {
      setFieldError('Current reading cannot be lower than the previous reading.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const saved = await api.createReading({
        meterId: selectedMeterId,
        month: Number(form.month),
        year: Number(form.year),
        currentReading: Number(form.currentReading)
      });
      setNotice(`Saved ${readingPeriodLabel(saved)} for ${selectedMeter?.meterName ?? 'selected meter'}.`);
      setForm((current) => ({
        ...current,
        currentReading: ''
      }));
      const updatedHistory = await api.getReadingHistory(selectedMeterId ?? undefined);
      setHistory(updatedHistory);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to save reading.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <header className="page-hero">
        <div className="eyebrow">New reading</div>
        <h2 className="hero-title">Capture the monthly meter value in a few taps.</h2>
        <p className="hero-copy">
          Pick a meter, enter the month and current reading, and let the backend calculate units and billing.
        </p>
      </header>

      {loading ? <div className="loading-surface">Loading reading form…</div> : null}
      {error ? <div className="alert">{error}</div> : null}
      {notice ? <div className="alert alert-success">{notice}</div> : null}
      {fieldError ? <div className="alert">{fieldError}</div> : null}

      <div className="grid split-grid">
        <article className="form-card">
          <div className="inline-stack">
            <p className="card-title">Reading form</p>
            <p className="muted">The latest reading history is shown alongside the form to keep data entry safe and fast.</p>
          </div>

          <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
            <div className="field">
              <label htmlFor="reading-meter">Meter</label>
              <select
                id="reading-meter"
                value={form.meterId}
                onChange={(event) => {
                  const meterId = event.target.value ? Number(event.target.value) : null;
                  setForm((current) => ({ ...current, meterId: event.target.value }));
                  setSelectedMeterId(meterId);
                }}
              >
                <option value="">Select meter</option>
                {meters.map((meter) => (
                  <option key={meter.id} value={meter.id}>
                    {meter.meterName} ({meter.meterType})
                  </option>
                ))}
              </select>
            </div>

            <div className="summary-row">
              <div className="field">
                <label htmlFor="reading-month">Month</label>
                <select id="reading-month" value={form.month} onChange={(event) => setForm((current) => ({ ...current, month: event.target.value }))}>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                    <option key={month} value={month}>
                      {monthName(month)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="reading-year">Year</label>
                <input
                  id="reading-year"
                  value={form.year}
                  onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))}
                  inputMode="numeric"
                  placeholder="2026"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="current-reading">Current reading</label>
              <input
                id="current-reading"
                value={form.currentReading}
                onChange={(event) => setForm((current) => ({ ...current, currentReading: event.target.value }))}
                inputMode="decimal"
                placeholder="2500"
              />
              <p className="helper">The backend stores the entry and calculates units consumed and bill amount.</p>
            </div>
          </form>

          <div className="form-actions">
            <button type="button" className="button button-secondary" onClick={() => setForm(emptyForm)}>
              Reset
            </button>
            <button type="button" className="button button-primary" onClick={() => void handleSubmit()} disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save reading'}
            </button>
          </div>
        </article>

        <article className="form-card">
          <div className="inline-stack">
            <p className="card-title">Reading hint</p>
            <p className="muted">The last stored reading helps prevent regressions before the request is sent.</p>
          </div>

          <div className="kpi-row">
            <div className="kpi">
              <p className="kpi-label">Latest previous</p>
              <p className="kpi-value">{formatReading(latestPreviousReading)}</p>
            </div>
            <div className="kpi">
              <p className="kpi-label">Current meter</p>
              <p className="kpi-value">{selectedMeter?.meterName ?? '—'}</p>
            </div>
            <div className="kpi">
              <p className="kpi-label">Rate per unit</p>
              <p className="kpi-value">₹{formatCurrency(meterRate)}</p>
            </div>
            <div className="kpi">
              <p className="kpi-label">Fixed charge</p>
              <p className="kpi-value">₹{formatCurrency(fixedCharge)}</p>
            </div>
          </div>

          {isLowerThanPrevious ? <div className="alert">Current reading is lower than the previous reading.</div> : null}

          <div className="panel">
            <h3 className="panel-title">Estimated bill</h3>
            <p className="muted">
              {estimatedBill == null ? 'Enter a current reading that is at least the previous reading to see a live preview.' : `Projected bill: ₹${formatCurrency(estimatedBill)}`}
            </p>
          </div>
        </article>
      </div>

      <section className="panel">
        <div className="toolbar" style={{ paddingTop: 0 }}>
          <div>
            <h3 className="panel-title">Recent history for {selectedMeter?.meterName ?? 'the selected meter'}</h3>
            <p className="muted">Newest entries appear first to keep the monthly workflow short.</p>
          </div>
          <span className="chip">{historyLoading ? 'Refreshing…' : `${history.length} entries`}</span>
        </div>

        {sortedHistory.length === 0 ? (
          <div className="loading-surface">No readings yet for this meter.</div>
        ) : (
          <div className="grid list-grid" style={{ marginTop: 16 }}>
            {sortedHistory.slice(0, 4).map((reading) => (
              <article key={reading.id} className="history-card">
                <div className="history-card-header">
                  <div className="inline-stack">
                    <p className="card-title">{readingPeriodLabel(reading)}</p>
                    <p className="muted">Created {new Date(reading.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="pill pill-muted">{reading.unitsConsumed} units</span>
                </div>

                <div className="summary-row">
                  <div className="kpi">
                    <p className="kpi-label">Previous</p>
                    <p className="kpi-value" style={{ fontSize: '1rem' }}>
                      {formatReading(reading.previousReading)}
                    </p>
                  </div>
                  <div className="kpi">
                    <p className="kpi-label">Current</p>
                    <p className="kpi-value" style={{ fontSize: '1rem' }}>
                      {formatReading(reading.currentReading)}
                    </p>
                  </div>
                  <div className="kpi">
                    <p className="kpi-label">Units consumed</p>
                    <p className="kpi-value" style={{ fontSize: '1rem' }}>
                      {formatReading(reading.unitsConsumed)}
                    </p>
                  </div>
                  <div className="kpi">
                    <p className="kpi-label">Bill amount</p>
                    <p className="kpi-value" style={{ fontSize: '1rem' }}>
                      ₹{formatCurrency(reading.billAmount)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
