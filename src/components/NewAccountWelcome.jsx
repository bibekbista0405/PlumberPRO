import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import '../styles/NewAccountWelcome.css';

const COPY = {
  customer: {
    title: (name) => `Welcome to PlumbPro${name ? `, ${name}` : ''}!`,
    body: "You're set up. The fastest way to see the value is to search for a plumber near you and send your first real booking request.",
    cta: { to: '/book-plumber', label: 'Book your first service' },
  },
  plumber: {
    title: (name) => `Welcome to the network${name ? `, ${name}` : ''}!`,
    body: 'Your profile is created but not yet public. Fill it out completely and our team will review it for verification — verified profiles get noticeably more requests.',
    cta: { to: '/plumber-dashboard', label: 'Complete your profile' },
  },
};

function NewAccountWelcome({ role = 'customer' }) {
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);
  if (!location.state?.justRegistered || dismissed) return null;
  const copy = COPY[role] || COPY.customer;

  return (
    <div className="new-account-welcome" role="status">
      <div className="new-account-icon"><Icon name="shieldCheck" size={20} /></div>
      <div className="new-account-copy">
        <strong>{copy.title(location.state.firstName)}</strong>
        <span>{copy.body}</span>
      </div>
      <div className="new-account-actions">
        <Link to={copy.cta.to} className="new-account-cta">{copy.cta.label}</Link>
        <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss"><Icon name="close" size={14} /></button>
      </div>
    </div>
  );
}
export default NewAccountWelcome;
