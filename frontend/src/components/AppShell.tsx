import { NavLink, useLocation } from 'react-router-dom';

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/settings', label: 'Settings' }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pageHint =
    location.pathname.startsWith('/meter/')
      ? 'Reading + history'
      : location.pathname.startsWith('/settings')
        ? 'Meters and billing setup'
        : 'Tenant meters';

  return (
    <div className="app-shell">
      <div className="app-glow app-glow-a" />
      <div className="app-glow app-glow-b" />
      <header className="topbar card glass">
        <div>
          <p className="eyebrow">MeterMate</p>
          <h1 className="brand-title">MeterMate</h1>
        </div>
        <div className="topbar-meta">
          <span className="chip chip-solid">Property 1</span>
          <span className="chip">{pageHint}</span>
        </div>
      </header>

      <nav className="nav-strip card glass" aria-label="Primary">
        {navigation.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="app-main">{children}</main>
    </div>
  );
}
