import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from './Icon';
import '../styles/PageTransitionOverlay.css';

// A decorative, non-blocking "pipe wipe" curtain that sweeps across the
// viewport whenever the route changes. Purely cosmetic: pointer-events are
// disabled throughout so it can never trap a click, and it skips the very
// first render so the site doesn't flash on initial load. Reduced-motion
// users get an instant, animation-free route change instead.
function PageTransitionOverlay() {
  const location = useLocation();
  const [phase, setPhase] = useState('idle');
  const firstRender = useRef(true);
  const timers = useRef([]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return undefined; }
    timers.current.forEach(clearTimeout);

    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setPhase('idle'); return undefined; }

    setPhase('cover');
    const t1 = setTimeout(() => setPhase('reveal'), 260);
    const t2 = setTimeout(() => setPhase('idle'), 260 + 360);
    timers.current = [t1, t2];
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (phase === 'idle') return null;

  return (
    <div className={`page-veil ${phase}`} aria-hidden="true">
      <div className="page-veil-glow" />
      <div className="page-veil-mark">
        <Icon name="droplet" size={30} filled />
      </div>
      <span className="page-veil-drop page-veil-drop-1" />
      <span className="page-veil-drop page-veil-drop-2" />
      <span className="page-veil-drop page-veil-drop-3" />
    </div>
  );
}

export default PageTransitionOverlay;
