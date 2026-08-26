import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/About.css';

function About() {
  return <main className="about-page">
    <section className="about-hero">
      <div className="about-hero-copy"><span className="eyebrow">ABOUT PLUMBPRO</span><h1>Plumbing service, organized around <span>trust.</span></h1><p>PlumbPro is a service-management platform designed to make booking, communication and job tracking clearer for customers and plumbing professionals.</p><div className="about-actions"><Link to="/services" className="about-primary">Explore services</Link><Link to="/contact" className="about-secondary">Talk to us</Link></div></div>
      <div className="about-visual">
        <svg viewBox="0 0 360 360" className="about-visual-svg" aria-hidden="true">
          <circle cx="180" cy="180" r="150" fill="none" stroke="var(--border)" strokeDasharray="2 10" />
          <path d="M180 70 L180 150 M180 150 L100 230 M180 150 L260 230" fill="none" stroke="var(--primary)" strokeWidth="2" opacity=".55" />
          <circle cx="180" cy="70" r="26" fill="var(--primary)" />
          <circle cx="100" cy="230" r="26" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
          <circle cx="260" cy="230" r="26" fill="var(--accent)" />
          <circle cx="180" cy="150" r="7" fill="var(--accent)" />
        </svg>
        <div className="about-visual-legend">
          <span><i style={{background:'var(--primary)'}} />Customer requests</span>
          <span><i style={{background:'var(--surface)',borderColor:'var(--primary)'}} />Plumber delivers</span>
          <span><i style={{background:'var(--accent)'}} />Admin oversees</span>
        </div>
      </div>
    </section>
    <section className="about-grid"><article><span>01</span><h2>Simple for customers</h2><p>Request a service, provide the required details and keep track of booking status from one account.</p></article><article><span>02</span><h2>Clear for plumbers</h2><p>Assigned work, customer details and job progress are presented in one focused workspace.</p></article><article><span>03</span><h2>Manageable for admins</h2><p>Administrators can oversee users, bookings, services and incoming contact messages without navigating disconnected tools.</p></article></section>
    <section className="about-values"><div><span className="eyebrow">OUR APPROACH</span><h2>Professional service should feel predictable.</h2></div><div><p>We focus on clear status updates, useful information, responsive interfaces and real data from the platform rather than decorative or fabricated activity.</p><p>PlumbPro can evolve as the service grows, while keeping the core experience understandable for every role.</p></div></section>
  </main>;
}
export default About;
