import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { MeterResponse, ReadingResponse } from '../api/types';
import { formatCurrency, formatCreatedAt, formatReading, readingPeriodLabel, sortReadingsDesc } from '../lib/format';

export function ReadingsPage() {
  const [readings, setReadings] = useState<ReadingResponse[]>([]);
  const [meters, setMeters] = useState<MeterResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meterIdFilter, setMeterIdFilter] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [readingData, meterData] = await Promise.all([api.getReadings(), api.getMeters()]);
        if (!active) {
          return;
        }

        setReadings(readingData);
        setMeters(meterData);
      } catch (cause) {
        if (active) {
          setError(cause instanceof ApiError ? cause.message : 'Unable to load readings.');
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

  const meterMap = useMemo(() => new Map(meters.map((meter) => [meter.id, meter])), [meters]);
  const filteredReadings = useMemo(() => {
    const sorted = sortReadingsDesc(readings);
    if (!meterIdFilter) {
      return sorted;
    }

    return sorted.filter((reading) => String(reading.meterId) === meterIdFilter);
  }, [meterIdFilter, readings]);

  return (
    <section className="page">
      <header className="page-hero">
        <div className="eyebrow">History</div>
        <h2 className="hero-title">Review monthly readings in one timeline.</h2>
        <p className="hero-copy">
          Filter by meter, keep the latest entries on top, and scan previous and current readings alongside the calculated bill.
        </p>
      </header>

      <div className="toolbar">
        <div className="field" style={{ minWidth: 240 }}>
          <label htmlFor="meter-filter">Filter by meter</label>
          <select id="meter-filter" value={meterIdFilter} onChange={(event) => setMeterIdFilter(event.target.value)}>
            <option value="">All meters</option>
            {meters.map((meter) => (
              <option key={meter.id} value={meter.id}>
                {meter.meterName}
              </option>
            ))}
          </select>
        </div>

        <div className="inline-actions">
          <span className="chip">{filteredReadings.length} records</span>
          <button type="button" className="button button-secondary" onClick={() => void window.location.reload()}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? <div className="loading-surface">Loading reading history…</div> : null}
      {error ? <div className="alert">{error}</div> : null}

      {!loading && filteredReadings.length === 0 ? (
        <div className="panel">
          <h3 className="panel-title">No readings found</h3>
          <p className="muted">Try a different filter or capture the first monthly reading.</p>
        </div>
      ) : null}

      <div className="mobile-only grid">
        {filteredReadings.map((reading) => {
          const meter = meterMap.get(reading.meterId);
          return (
            <article key={reading.id} className="history-card">
              <div className="history-card-header">
                <div className="inline-stack">
                  <p className="card-title">{meter?.meterName ?? `Meter ${reading.meterId}`}</p>
                  <p className="muted">{readingPeriodLabel(reading)}</p>
                </div>
                <span className="pill pill-muted">{formatCreatedAt(reading.createdAt)}</span>
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
                  <p className="kpi-label">Units</p>
                  <p className="kpi-value" style={{ fontSize: '1rem' }}>
                    {formatReading(reading.unitsConsumed)}
                  </p>
                </div>
                <div className="kpi">
                  <p className="kpi-label">Bill</p>
                  <p className="kpi-value" style={{ fontSize: '1rem' }}>
                    ₹{formatCurrency(reading.billAmount)}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="desktop-only table-shell">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Meter</th>
              <th>Month</th>
              <th>Previous</th>
              <th>Current</th>
              <th>Units</th>
              <th>Bill</th>
              <th>Created at</th>
            </tr>
          </thead>
          <tbody>
            {filteredReadings.map((reading) => {
              const meter = meterMap.get(reading.meterId);
              return (
                <tr key={reading.id}>
                  <td>{meter?.meterName ?? `Meter ${reading.meterId}`}</td>
                  <td>{readingPeriodLabel(reading)}</td>
                  <td>{formatReading(reading.previousReading)}</td>
                  <td>{formatReading(reading.currentReading)}</td>
                  <td>{formatReading(reading.unitsConsumed)}</td>
                  <td>₹{formatCurrency(reading.billAmount)}</td>
                  <td>{formatCreatedAt(reading.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
