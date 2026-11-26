import React, { useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/PageTransitionOverlay.css';

const TITLES = {
  '/': 'Home',
  '/services': 'Services',
  '/about': 'About Us',
  '/blog': 'The Blog',
  '/book-plumber': 'Book a Plumber',
  '/contact': 'Contact',
  '/login': 'Welcome',
  '/privacy': 'Privacy',
  '/terms': 'Terms',
  '/legal': 'Legal',
  '/cancellation-policy': 'Cancellation',
  '/customer-dashboard': 'Your Dashboard',
  '/plumber-dashboard': 'Your Dashboard',
  '/admin-dashboard': 'Admin Console',
};

function titleFor(path) {
  if (TITLES[path]) return TITLES[path];
  if (path.startsWith('/blog/')) return 'The Blog';
  if (path.startsWith('/plumbers/')) return 'Plumber Profile';
  return 'PlumbPro';
}

// Pipe network drawn behind the title. Same elbow-joint language as the hero.
const PIPES = [
  'M -20 600 L 260 600 L 300 560 L 300 330 L 340 290 L 640 290 L 680 250 L 680 110 L 900 110 L 940 70 L 1220 70',
  'M -20 730 L 140 730 L 180 690 L 480 690 L 520 650 L 820 650 L 860 610 L 1220 610',
  'M 1220 420 L 960 420 L 920 460 L 920 560 L 880 600',
  'M -20 200 L 200 200 L 240 160 L 460 160',
];

const BUBBLES = Array.from({ length: 12 }, (_, i) => ({
  left: 6 + ((i * 83) % 88),
  size: 6 + ((i * 7) % 14),
  delay: 0.35 + (i % 6) * 0.09,
  dur: 0.9 + (i % 4) * 0.18,
}));

// Full-screen "water + pipework" motion-graphics transition. Three wave layers
// flood the screen, a title card plays on top (pipes draw themselves, ring
// traces, letters rise), then the layers drain upward. The route content is
// held back (html.pv-busy) until the drain begins, so the new page is revealed
// by the water rather than popping in underneath. Purely decorative:
// pointer-events are off throughout, and reduced-motion users get none of it.
function PageTransitionOverlay() {
  const location = useLocation();
  const [run, setRun] = useState(null);
  const first = useRef(true);
  const counter = useRef(0);
  const timers = useRef([]);

  useLayoutEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    if (reduced) { root.classList.remove('pv-busy'); setRun(null); return undefined; }

    root.classList.add('pv-busy');
    counter.current += 1;
    setRun({ id: counter.current, title: titleFor(location.pathname) });
    timers.current = [
      setTimeout(() => root.classList.remove('pv-busy'), 900),
      setTimeout(() => setRun(null), 1800),
    ];
    return undefined;
  }, [location.pathname]);

  // Never leave the page hidden if the overlay unmounts mid-run.
  useLayoutEffect(() => () => {
    timers.current.forEach(clearTimeout);
    document.documentElement.classList.remove('pv-busy');
  }, []);

  if (!run) return null;

  const words = run.title.split(' ');
  let letterIndex = 0;

  return (
    <div className="pv" key={run.id} aria-hidden="true">
      {['copper', 'teal', 'deep'].map(tone => (
        <div className={`pv-layer pv-${tone}`} key={tone}>
          <svg className="pv-wave pv-wave-top" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0 60 Q150 0 300 60 T600 60 T900 60 T1200 60 V120 H0Z" /></svg>
          <svg className="pv-wave pv-wave-bottom" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0 60 Q150 0 300 60 T600 60 T900 60 T1200 60 V120 H0Z" /></svg>
        </div>
      ))}

      <div className="pv-stage">
        <svg className="pv-pipes" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          {PIPES.map((d, i) => <path key={i} d={d} style={{ animationDelay: `${0.32 + i * 0.07}s` }} />)}
          {[[300, 560], [340, 290], [680, 250], [940, 70], [180, 690], [520, 650], [920, 460]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="5" style={{ animationDelay: `${0.5 + i * 0.05}s` }} />
          ))}
        </svg>

        {BUBBLES.map((b, i) => (
          <span key={i} className="pv-bubble" style={{ left: `${b.left}%`, width: b.size, height: b.size, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s` }} />
        ))}

        <div className="pv-card">
          <div className="pv-emblem">
            <svg viewBox="0 0 120 120" className="pv-ring">
              <circle cx="60" cy="60" r="54" className="pv-ring-draw" />
              <circle cx="60" cy="60" r="46" className="pv-ring-dash" />
            </svg>
            <img src="/plumbpro-mark.svg" alt="" />
          </div>
          <h2 className="pv-title">
            {words.map((word, wi) => (
              <span className="pv-word" key={wi}>
                {word.split('').map(ch => {
                  const i = letterIndex; letterIndex += 1;
                  return <span className="pv-letter" key={i} style={{ animationDelay: `${0.42 + i * 0.035}s` }}>{ch}</span>;
                })}
              </span>
            ))}
          </h2>
          <span className="pv-sub">PLUMBPRO · SERVICE, MADE SIMPLER</span>
        </div>

        <div className="pv-progress"><i /></div>
      </div>
    </div>
  );
}

export default PageTransitionOverlay;
