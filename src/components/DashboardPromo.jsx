import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import '../styles/DashboardPromo.css';

const MESSAGES = [
  { icon: 'star', title: 'Your review helps the next customer choose well', body: "If you've had a booking completed recently, a quick honest rating makes real reviews — not just star counts — genuinely useful.", cta: { label: 'View my bookings', to: '#bookings' } },
  { icon: 'shieldCheck', title: "Didn't love how a job went?", body: "You can report a plumber directly from any booking's details — it goes straight to our support team, not the plumber.", cta: { label: 'Learn how it works', to: '/blog/what-plumber-verification-actually-means' } },
  { icon: 'check', title: 'Know someone who needs a plumber?', body: 'Word of mouth is how a marketplace like this actually grows — send them to PlumbPro next time a pipe misbehaves.', cta: { label: 'Browse services', to: '/services' } },
  { icon: 'arrowUpRight', title: 'A few minutes now saves a bigger repair later', body: "Our blog has short, practical guides — like a seasonal checklist for your water tank — worth a skim between bookings.", cta: { label: 'Read the blog', to: '/blog' } },
];

function DashboardPromo() {
  const item = useMemo(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)], []);
  return (
    <div className="dash-promo">
      <div className="dash-promo-icon"><Icon name={item.icon} size={18} /></div>
      <div className="dash-promo-copy">
        <strong>{item.title}</strong>
        <span>{item.body}</span>
      </div>
      {item.cta.to.startsWith('#')
        ? <a href={item.cta.to} className="dash-promo-cta">{item.cta.label}</a>
        : <Link to={item.cta.to} className="dash-promo-cta">{item.cta.label}</Link>}
    </div>
  );
}
export default DashboardPromo;
