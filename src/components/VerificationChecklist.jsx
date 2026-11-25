import React from 'react';
import Icon from './Icon';
import '../styles/VerificationChecklist.css';

function Item({ done, children }) {
  return (
    <li className={done ? 'done' : ''}>
      <span className="check-dot">{done && <Icon name="check" size={11} />}</span>
      {children}
    </li>
  );
}

function VerificationChecklist({ profile, completedJobs = 0 }) {
  if (!profile) return null;
  if (profile.verified) {
    return (
      <div className="verify-panel verify-panel-done">
        <div className="verify-panel-icon"><Icon name="shieldCheck" size={20} /></div>
        <div>
          <strong>Your profile is verified</strong>
          <span>Keep your response times quick and your rating strong — that's what keeps you ranked near the top of search.</span>
        </div>
      </div>
    );
  }

  const checks = [
    { done: !!profile.photo_url, label: 'Add a profile photo' },
    { done: !!(profile.bio && profile.bio.trim().length >= 30), label: 'Write a bio (at least a couple of sentences)' },
    { done: !!(profile.education || profile.certifications), label: 'List your education, training, or certifications' },
    { done: Number(profile.experience_years) > 0, label: 'Add your years of experience' },
    { done: !!(profile.location_name && profile.location_name.trim()), label: 'Set your service area' },
    { done: completedJobs >= 1, label: 'Complete at least one real booking' },
  ];
  const doneCount = checks.filter(c => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);

  return (
    <div className="verify-panel">
      <div className="verify-panel-head">
        <div>
          <strong>Get verified, get more bookings</strong>
          <span>Complete profiles with real reviews get reviewed for verification first. Here's what's left:</span>
        </div>
        <div className={`verify-ring verify-ring-${doneCount}`}><b>{pct}%</b></div>
      </div>
      <ul className="verify-checklist">
        {checks.map((c, i) => <Item key={i} done={c.done}>{c.label}</Item>)}
      </ul>
      <p className="verify-footnote">Once you look complete, our team reviews your profile — there's no separate form to fill out.</p>
    </div>
  );
}
export default VerificationChecklist;
