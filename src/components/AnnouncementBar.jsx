import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import '../styles/Marketing.css';

const MESSAGES = [
  { icon: 'shieldCheck', text: 'Verified plumbers and real customer reviews — in one place.', cta: 'Find a plumber', to: '/book-plumber' },
  { icon: 'message', text: 'Message your plumber and follow every booking, start to finish.', cta: 'See services', to: '/services' },
  { icon: 'wrench', text: 'Are you a plumber? Create your profile and get discovered locally.', cta: 'Join PlumbPro', to: '/login' },
];
const KEY = 'plumbpro:announce-dismissed';

function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(() => {
    try { return window.sessionStorage.getItem(KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    if (hidden) return undefined;
    const timer = setInterval(() => setIndex(i => (i + 1) % MESSAGES.length), 5200);
    return () => clearInterval(timer);
  }, [hidden]);

  if (hidden) return null;
  const dismiss = () => {
    setHidden(true);
    try { window.sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
  };
  const m = MESSAGES[index];

  return (
    <div className="announce" role="region" aria-label="Announcements">
      <div className="announce-inner">
        <span className="announce-pulse" aria-hidden="true" />
        <div className="announce-slide" key={index} aria-live="polite">
          <Icon name={m.icon} size={15} />
          <span>{m.text}</span>
          <Link to={m.to} className="announce-cta">{m.cta} <Icon name="arrowUpRight" size={13} /></Link>
        </div>
        <button type="button" className="announce-close" onClick={dismiss} aria-label="Dismiss announcement"><Icon name="close" size={14} /></button>
      </div>
    </div>
  );
}
export default AnnouncementBar;
