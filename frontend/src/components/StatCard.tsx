interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'warm' | 'cool' | 'teal';
}

export function StatCard({ label, value, hint, tone = 'default' }: StatCardProps) {
  return (
    <article className={`stat-card tone-${tone} card`}>
      <p className="eyebrow">{label}</p>
      <div className="stat-value">{value}</div>
      {hint ? <p className="muted">{hint}</p> : null}
    </article>
  );
}
