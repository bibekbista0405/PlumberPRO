import React from 'react';
import Icon from './Icon';
import '../styles/Marketing.css';

const STEPS = [
  { icon: 'search', title: 'Search & compare', text: 'Search by location or service and compare verified plumber profiles and reviews.' },
  { icon: 'bookings', title: 'Book in minutes', text: 'Describe the job, send your request and hear back without phone-tag.' },
  { icon: 'check', title: 'Track & review', text: 'Follow progress, message your plumber, and review the work once it is done.' },
];

function HowItWorks() {
  return (
    <section className="mk-section mk-how" id="how-it-works" data-reveal>
      <div className="mk-head">
        <span className="eyebrow">HOW IT WORKS</span>
        <h2>From leak to <span>sorted</span> in three steps.</h2>
        <p>No guessing who is coming and no chasing updates — every stage is visible.</p>
      </div>
      <div className="mk-steps">
        <svg className="mk-steps-line" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 20 H330 L350 8 H650 L670 20 H1000" /></svg>
        {STEPS.map((s, i) => (
          <article className="mk-step" key={s.title} style={{ '--d': `${i * 0.18}s` }}>
            <div className="mk-step-badge"><Icon name={s.icon} size={24} /><b>{i + 1}</b></div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
export default HowItWorks;
