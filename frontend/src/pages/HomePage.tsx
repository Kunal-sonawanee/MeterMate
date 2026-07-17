import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { MeterResponse } from '../api/types';

export function HomePage() {
  const [meters, setMeters] = useState<MeterResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMeters() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTenantMeters();
      setMeters(data);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to load tenant meters.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMeters();
  }, []);

  return (
    <section className="page">
      <header className="page-hero">
        <div className="eyebrow">Home</div>
        <h2 className="hero-title">All tenant meters in one place.</h2>
        <p className="hero-copy">Tap a meter to open reading entry and its monthly history together.</p>
      </header>

      <div className="toolbar">
        <p className="muted">Showing SUB meters only.</p>
        <button type="button" className="button button-secondary" onClick={() => void loadMeters()} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading ? <div className="loading-surface">Loading meters...</div> : null}
      {error ? <div className="alert">{error}</div> : null}

      {!loading && meters.length === 0 ? (
        <section className="panel">
          <h3 className="panel-title">No tenant meters found</h3>
          <p className="muted">Create meters from Settings.</p>
        </section>
      ) : null}

      <div className="grid list-grid">
        {meters.map((meter) => (
          <article key={meter.id} className="meter-card">
            <div className="meter-card-header">
              <div className="inline-stack">
                <p className="card-title">{meter.meterName}</p>
                <p className="muted">Tenant: {meter.tenantName?.trim() || 'Not set'}</p>
              </div>
              <span className="pill pill-sub">SUB</span>
            </div>

            <p className="muted">Phone: {meter.phone?.trim() || 'Not set'}</p>

            <Link to={`/meter/${meter.id}`} className="button button-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
              Open meter
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
