import React from 'react';
import Icon from './Icon';
import '../styles/Portal.css';

export const FLOW = [
  ['pending', 'Requested'],
  ['confirmed', 'Confirmed'],
  ['on_the_way', 'On the way'],
  ['arrived', 'Arrived'],
  ['in_progress', 'Working'],
  ['completed', 'Done'],
];
const FLOW_INDEX = { pending: 0, assigned: 0, confirmed: 1, on_the_way: 2, arrived: 3, in_progress: 4, completed: 5, reviewed: 5 };
const TERMINAL = ['cancelled', 'rejected', 'expired'];

export const prettyStatus = (s) => String(s || '').replace(/_/g, ' ');

export function formatDay(value) {
  const raw = value instanceof Date && !Number.isNaN(value.getTime())
    ? `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`
    : String(value || '').slice(0, 10);
  const p = raw.split('-').map(Number);
  if (p.length !== 3 || !p.every(Number.isFinite)) return 'Date unavailable';
  return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

export function StatusTracker({ status, compact }) {
  if (TERMINAL.includes(status)) {
    return null;
  }
  const at = FLOW_INDEX[status] ?? 0;
  return (
    <ol className={`pt-track ${compact ? 'compact' : ''}`} aria-label={`Progress: ${prettyStatus(status)}`}>
      {FLOW.map(([key, label], i) => (
        <li key={key} className={i < at ? 'done' : i === at ? 'now' : ''}>
          <span className="pt-dot">{i < at && <Icon name="check" size={10} />}</span>
          <em>{label}</em>
        </li>
      ))}
    </ol>
  );
}

export function PortalHero({ eyebrow, title, subtitle, actions, badge }) {
  return (
    <section className="pt-hero">
      <div className="pt-hero-bg" aria-hidden="true"><i /><i /></div>
      <div className="pt-hero-copy">
        <span className="pt-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {actions && <div className="pt-hero-actions">{actions}</div>}
      </div>
      {badge && <div className="pt-hero-badge">{badge}</div>}
    </section>
  );
}

export function StatTile({ icon, label, value, tone = 'teal', hint, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={`pt-stat tone-${tone} ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <span className="pt-stat-icon"><Icon name={icon} size={18} /></span>
      <span className="pt-stat-body"><small>{label}</small><strong>{value}</strong>{hint && <i>{hint}</i>}</span>
    </Tag>
  );
}

export function SectionTitle({ title, text, action }) {
  return (
    <div className="pt-section-title">
      <div><h2>{title}</h2>{text && <p>{text}</p>}</div>
      {action}
    </div>
  );
}

export function EmptyCard({ icon = 'bookings', title, text, action }) {
  return (
    <div className="pt-empty">
      <span><Icon name={icon} size={22} /></span>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Pills({ items, value, onChange, label }) {
  return (
    <div className="pt-pills" role="group" aria-label={label}>
      {items.map(([key, text, count]) => (
        <button type="button" key={key} className={value === key ? 'on' : ''} aria-pressed={value === key} onClick={() => onChange(key)}>
          {text}{count !== undefined && <b>{count}</b>}
        </button>
      ))}
    </div>
  );
}

// A booking as a card: who, what, when, where and how far along it is.
export function WorkCard({ title, subtitle, status, date, time, address, meta, children, onOpen, spotlight }) {
  return (
    <article className={`pt-card ${spotlight ? 'spotlight' : ''}`}>
      <header className="pt-card-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <span>{subtitle}</span>}
        </div>
        <span className={`status status-${status}`}>{prettyStatus(status)}</span>
      </header>
      <dl className="pt-facts">
        <div><dt><Icon name="calendar" size={13} /> When</dt><dd>{formatDay(date)}{time ? ` · ${String(time).slice(0, 5)}` : ''}</dd></div>
        {address && <div><dt><Icon name="pin" size={13} /> Where</dt><dd>{address}</dd></div>}
        {meta && <div><dt><Icon name={meta.icon || 'users'} size={13} /> {meta.label}</dt><dd>{meta.value}</dd></div>}
      </dl>
      <StatusTracker status={status} compact={!spotlight} />
      <footer className="pt-card-actions">
        {onOpen && <button type="button" className="pt-btn ghost" onClick={onOpen}>Details</button>}
        {children}
      </footer>
    </article>
  );
}
