import React, { useEffect, useState } from 'react';
import '../styles/HeroSection.css';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { getPublicStats } from '../api/plumberApi';

function HeroSection() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getPublicStats().then(setStats).catch(() => {});
  }, []);

  const trustItems = [
    {
      icon: 'shieldCheck',
      label: stats?.verifiedPlumbers > 0 ? `${stats.verifiedPlumbers} verified plumber${stats.verifiedPlumbers === 1 ? '' : 's'}` : 'Platform-verified plumbers',
    },
    {
      icon: 'check',
      label: stats?.completedBookings > 0 ? `${stats.completedBookings} job${stats.completedBookings === 1 ? '' : 's'} completed` : 'Real booking lifecycle tracking',
    },
    {
      icon: 'star',
      label: stats?.averageRating ? `${stats.averageRating} average from ${stats.totalReviews} review${stats.totalReviews === 1 ? '' : 's'}` : 'Location-aware matching',
    },
  ];

  return (
    <section className="hero">
      <div className="hero-grid" aria-hidden="true" />
      <svg className="hero-flow" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path className="flow-line-a" d="M -20 620 L 260 620 L 300 580 L 300 340 L 340 300 L 640 300 L 680 260 L 680 120 L 900 120 L 940 80 L 1220 80" />
        <path className="flow-line-b" d="M -20 740 L 140 740 L 180 700 L 480 700 L 520 660 L 820 660 L 860 620 L 1220 620" />
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
          <p>Find verified plumbers, request a service, and follow your booking from one clear customer experience — no phone-tag, no guessing who's coming.</p>
          <div className="hero-buttons">
            <Link to="/book-plumber" className="btn-primary">Book a Plumber <Icon name="arrowUpRight" size={15} /></Link>
            <a href="#find-plumber" className="btn-secondary">Explore nearby plumbers</a>
          </div>
        </div>
        <div className="hero-proof">
          {trustItems.map((item, i) => (
            <span key={i}><b><Icon name={item.icon} size={13} /></b> {item.label}</span>
          ))}
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
