import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { MeterResponse, ReadingResponse, SettingsResponse } from '../api/types';
import { formatCurrency, formatCreatedAt, formatReading, monthName, readingPeriodLabel, sortReadingsDesc } from '../lib/format';

const now = new Date();

interface ReadingFormState {
  month: string;
  year: string;
  currentReading: string;
}

export function MeterDetailPage() {
  const params = useParams();
  const meterId = Number(params.meterId);

  const [meter, setMeter] = useState<MeterResponse | null>(null);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [history, setHistory] = useState<ReadingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<ReadingFormState>({
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    currentReading: ''
  });

  const sortedHistory = useMemo(() => sortReadingsDesc(history), [history]);
  const latestReading = sortedHistory[0] ?? null;
  const previousReading = latestReading?.currentReading ?? null;
  const currentReadingValue = form.currentReading ? Number(form.currentReading) : null;

  async function loadPage() {
    if (Number.isNaN(meterId)) {
      setError('Invalid meter id.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [meterData, settingsData, historyData] = await Promise.all([
        api.getMeter(meterId),
        api.getSettings(),
        api.getReadingHistory(meterId)
      ]);
      setMeter(meterData);
      setSettings(settingsData);
      setHistory(historyData);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to load meter details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [meterId]);

  async function saveReading() {
    setFormError(null);
    setNotice(null);

    const month = Number(form.month);
    const year = Number(form.year);
    const current = Number(form.currentReading);

    if (!meter || Number.isNaN(meterId)) {
      setFormError('Meter is unavailable.');
      return;
    }

    if (month < 1 || month > 12) {
      setFormError('Month must be between 1 and 12.');
      return;
    }

    if (!form.year.trim() || Number.isNaN(year)) {
      setFormError('Year is required.');
      return;
    }

    if (!form.currentReading.trim() || Number.isNaN(current)) {
      setFormError('Current reading must be numeric.');
      return;
    }

    if (previousReading != null && current < previousReading) {
      setFormError('Current reading cannot be lower than previous reading.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.createReading({
        meterId,
        month,
        year,
        currentReading: current
      });
      setNotice('Reading saved.');
      setForm((currentForm) => ({ ...currentForm, currentReading: '' }));
      const updatedHistory = await api.getReadingHistory(meterId);
      setHistory(updatedHistory);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to save reading.');
    } finally {
      setSaving(false);
    }
  }

  const estimatedBill =
    settings && previousReading != null && currentReadingValue != null && currentReadingValue >= previousReading
      ? (currentReadingValue - previousReading) * settings.ratePerUnit + settings.fixedCharge
      : null;

  return (
    <section className="page">
      <header className="page-hero">
        <div className="eyebrow">Meter</div>
        <h2 className="hero-title">{meter?.meterName ?? 'Meter details'}</h2>
        <p className="hero-copy">Add a monthly reading at the top. Reading history is shown right below.</p>
        <div className="hero-actions">
          <Link to="/" className="button button-secondary">
            Back to meters
          </Link>
        </div>
      </header>

      {loading ? <div className="loading-surface">Loading meter page...</div> : null}
      {error ? <div className="alert">{error}</div> : null}
      {notice ? <div className="alert alert-success">{notice}</div> : null}
      {formError ? <div className="alert">{formError}</div> : null}

      {!loading ? (
        <article className="form-card">
          <div className="inline-stack">
            <p className="card-title">Add new reading</p>
            <p className="muted">Previous reading: {formatReading(previousReading)}</p>
          </div>

          <div className="form-grid">
            <div className="summary-row">
              <div className="field">
                <label htmlFor="month">Month</label>
                <select id="month" value={form.month} onChange={(event) => setForm((current) => ({ ...current, month: event.target.value }))}>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                    <option key={month} value={month}>
                      {monthName(month)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="year">Year</label>
                <input id="year" value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))} inputMode="numeric" />
              </div>
            </div>

            <div className="field">
              <label htmlFor="current">Current reading</label>
              <input
                id="current"
                value={form.currentReading}
                onChange={(event) => setForm((current) => ({ ...current, currentReading: event.target.value }))}
                inputMode="decimal"
                placeholder="2500"
              />
            </div>

            <div className="kpi-row">
              <div className="kpi">
                <p className="kpi-label">Rate</p>
                <p className="kpi-value">₹{formatCurrency(settings?.ratePerUnit ?? 0)}</p>
              </div>
              <div className="kpi">
                <p className="kpi-label">Fixed</p>
                <p className="kpi-value">₹{formatCurrency(settings?.fixedCharge ?? 0)}</p>
              </div>
              <div className="kpi" style={{ gridColumn: '1 / -1' }}>
                <p className="kpi-label">Estimated bill</p>
                <p className="kpi-value">{estimatedBill == null ? '—' : `₹${formatCurrency(estimatedBill)}`}</p>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="button button-secondary" onClick={() => setForm((current) => ({ ...current, currentReading: '' }))}>
              Clear
            </button>
            <button type="button" className="button button-primary" onClick={() => void saveReading()} disabled={saving}>
              {saving ? 'Saving...' : 'Save reading'}
            </button>
          </div>
        </article>
      ) : null}

      <section className="panel">
        <h3 className="panel-title">Reading history</h3>
        <p className="muted">Newest to oldest.</p>

        {sortedHistory.length === 0 ? (
          <div className="loading-surface">No history yet.</div>
        ) : (
          <div className="table-shell" style={{ marginTop: 12 }}>
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Previous</th>
                  <th>Current</th>
                  <th>Units</th>
                  <th>Bill</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.map((reading) => (
                  <tr key={reading.id}>
                    <td>{readingPeriodLabel(reading)}</td>
                    <td>{formatReading(reading.previousReading)}</td>
                    <td>{formatReading(reading.currentReading)}</td>
                    <td>{formatReading(reading.unitsConsumed)}</td>
                    <td>₹{formatCurrency(reading.billAmount)}</td>
                    <td>{formatCreatedAt(reading.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
