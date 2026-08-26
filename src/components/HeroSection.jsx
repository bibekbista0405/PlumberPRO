import React from 'react';
import '../styles/HeroSection.css';
import { Link } from 'react-router-dom';
import Icon from './Icon';

function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-grid" aria-hidden="true" />
      <svg className="hero-flow" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M -20 620 L 260 620 L 300 580 L 300 340 L 340 300 L 640 300 L 680 260 L 680 120 L 900 120 L 940 80 L 1220 80" />
        <path d="M -20 740 L 140 740 L 180 700 L 480 700 L 520 660 L 820 660 L 860 620 L 1220 620" />
        <circle cx="300" cy="580" r="4" />
        <circle cx="340" cy="300" r="4" className="copper" />
        <circle cx="680" cy="260" r="4" />
        <circle cx="940" cy="80" r="4" className="copper" />
        <circle cx="180" cy="700" r="4" className="copper" />
        <circle cx="520" cy="660" r="4" />
        <circle cx="860" cy="620" r="4" className="copper" />
      </svg>
      <div className="hero-glow hero-glow-one" aria-hidden="true" />
      <div className="hero-glow hero-glow-two" aria-hidden="true" />
      <div className="hero-content">
        <div className="hero-copy">
          <span className="hero-kicker">LOCAL PLUMBING, MADE SIMPLE</span>
          <h1>Reliable plumbing help, <span>when you need it.</span></h1>
          <p>Find verified plumbers, request a service, and follow your booking from one clear customer experience.</p>
          <div className="hero-buttons">
            <Link to="/book-plumber" className="btn-primary">Book a Plumber <Icon name="arrowUpRight" size={15} /></Link>
            <a href="#find-plumber" className="btn-secondary">Explore nearby plumbers</a>
          </div>
        </div>
        <div className="hero-proof">
          <span><b>01</b> Verified professionals</span>
          <span><b>02</b> Location-aware matching</span>
          <span><b>03</b> Clear booking status</span>
        </div>
      </div>
      <div className="hero-mark" aria-hidden="true">
        <span className="hero-mark-label">Live booking status</span>
        <ul className="hero-mark-flow">
          <li className="done"><i /> Requested</li>
          <li className="done"><i /> Accepted</li>
          <li className="active"><i /> On the way</li>
          <li><i /> Completed</li>
        </ul>
      </div>
    </section>
  );
}
export default HeroSection;
