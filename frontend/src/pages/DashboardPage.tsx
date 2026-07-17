import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { DashboardResponse } from '../api/types';
import { StatCard } from '../components/StatCard';
import { formatCurrency, formatReading } from '../lib/format';

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getDashboard();
        if (active) {
          setDashboard(data);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof ApiError ? cause.message : 'Unable to load dashboard.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="page">
      <header className="page-hero">
        <div className="eyebrow">Overview</div>
        <h2 className="hero-title">Quick monthly visibility for the active property.</h2>
        <p className="hero-copy">
          Track the main meter, split tenant and owner units, and review collection totals from one calm mobile-first screen.
        </p>
        <div className="hero-actions">
          <span className="chip chip-solid">Seeded property ready</span>
          <span className="chip">MeterMate backend connected</span>
        </div>
      </header>

      {loading ? <div className="loading-surface">Loading dashboard…</div> : null}

      {error ? (
        <div className="alert">
          <strong>Dashboard unavailable.</strong> {error}
        </div>
      ) : null}

      {dashboard ? (
        <div className="grid stat-grid">
          <StatCard label="Main meter units" value={formatReading(dashboard.mainMeterUnits)} hint="Current total for the main line" tone="cool" />
          <StatCard label="Tenant units" value={formatReading(dashboard.tenantUnits)} hint="Units assigned to tenants" tone="warm" />
          <StatCard label="Owner units" value={formatReading(dashboard.ownerUnits)} hint="Units carried by the owner" tone="teal" />
          <StatCard label="Total collection" value={`₹${formatCurrency(dashboard.totalCollection)}`} hint="Bill value across the property" tone="default" />
        </div>
      ) : null}

      <section className="panel">
        <h3 className="panel-title">Workflow snapshot</h3>
        <p className="muted">
          The frontend is wired for the existing API flow: open meters, capture a new reading, then review the history list and settings without leaving the app.
        </p>
        <div className="kpi-row" style={{ marginTop: 16 }}>
          <div className="kpi">
            <p className="kpi-label">Property</p>
            <p className="kpi-value">1</p>
          </div>
          <div className="kpi">
            <p className="kpi-label">Main meter rule</p>
            <p className="kpi-value">Enforced</p>
          </div>
          <div className="kpi">
            <p className="kpi-label">Reading flow</p>
            <p className="kpi-value">Fast</p>
          </div>
          <div className="kpi">
            <p className="kpi-label">Settings sync</p>
            <p className="kpi-value">Live</p>
          </div>
        </div>
      </section>
    </section>
  );
}
