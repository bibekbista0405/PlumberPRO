import React, { useEffect, useRef, useState } from 'react';
import { getPublicStats } from '../api/plumberApi';
import '../styles/Marketing.css';

function CountUp({ value, decimals = 0, run }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!run) return undefined;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setShown(value); return undefined; }
    let frame; const start = performance.now(); const duration = 1400;
    const tick = now => {
      const t = Math.min((now - start) / duration, 1);
      setShown(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, value]);
  return <>{shown.toFixed(decimals)}</>;
}

// Shows only real numbers from the public stats endpoint. Zero or missing
// values are left out, and the whole band hides if there is nothing real to show.
function StatsBand() {
  const [stats, setStats] = useState(null);
  const [run, setRun] = useState(false);
  const ref = useRef(null);

  useEffect(() => { getPublicStats().then(setStats).catch(() => {}); }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setRun(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setRun(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [stats]);

  const items = [];
  if (Number(stats?.verifiedPlumbers) > 0) items.push({ label: 'Verified plumbers', value: Number(stats.verifiedPlumbers), decimals: 0 });
  if (Number(stats?.completedBookings) > 0) items.push({ label: 'Jobs completed', value: Number(stats.completedBookings), decimals: 0 });
  if (Number(stats?.averageRating) > 0) items.push({ label: `Average rating · ${stats.totalReviews} review${Number(stats.totalReviews) === 1 ? '' : 's'}`, value: Number(stats.averageRating), decimals: 1, suffix: ' / 5' });
  if (!items.length) return null;

  return (
    <section className="mk-stats" ref={ref} data-reveal>
      <div className="mk-stats-inner">
        {items.map(it => (
          <div className="mk-stat" key={it.label}>
            <strong><CountUp value={it.value} decimals={it.decimals} run={run} />{it.suffix || ''}</strong>
            <span>{it.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
export default StatsBand;
