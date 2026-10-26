// Page scaffolding: header with HUD kicker, back links, side-panel sections and detail lists.
import Link from 'next/link';

export function PageHeader({ kicker, title, lead, actions }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
      <div>
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h1 className="text-[28px] leading-9 font-semibold text-on-surface md:text-headline-lg">{title}</h1>
        {lead && <p className="mt-1 max-w-2xl text-body-md text-on-surface-variant">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function BackLink({ href, children }) {
  return (
    <Link href={href} className="mb-6 inline-flex items-center gap-1 font-mono text-label-md text-on-surface-variant hover:text-primary-container">
      ← {children}
    </Link>
  );
}

export function Section({ title, icon, actions, children, className = '' }) {
  return (
    <section className={`card space-y-4 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-headline-sm font-medium text-on-surface">
            {icon}
            {title}
          </h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

// <dl> of label/value rows for side panels.
export function DetailList({ items }) {
  return (
    <dl className="space-y-3">
      {items.filter(Boolean).map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-2 last:border-0 last:pb-0">
          <dt className="font-mono text-label-md uppercase text-on-surface-variant">{label}</dt>
          <dd className="text-right text-body-sm text-on-surface">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Avatar({ text, color = 'text-primary-container' }) {
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-mono text-label-md font-bold ${color}`} aria-hidden="true">
      {text}
    </span>
  );
}
