import React from 'react';
import '../styles/Marketing.css';

const ITEMS = ['Verified plumbers', 'Real customer reviews', 'Location-aware search', 'Live booking tracking', 'In-app messaging', 'Clear job stages', 'Built for customers & plumbers', 'Book in minutes'];

function MarqueeStrip() {
  const row = ITEMS.map(t => <span className="mk-marquee-item" key={t}><i aria-hidden="true" />{t}</span>);
  return (
    <div className="mk-marquee" aria-label="Why PlumbPro">
      <div className="mk-marquee-track">
        <div className="mk-marquee-row">{row}</div>
        <div className="mk-marquee-row" aria-hidden="true">{row}</div>
      </div>
    </div>
  );
}
export default MarqueeStrip;
