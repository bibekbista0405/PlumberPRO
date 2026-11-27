import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/About.css';
import { useSEO } from '../hooks/useSEO';
import Icon from '../components/Icon';

const developers = [
  { name: 'Anil Gupta', role: 'Co-Founder & Developer', focus: ['Product', 'Engineering'], bio: 'Anil works on PlumbPro\'s product and engineering, focused on making the booking and job-tracking experience clear for both customers and plumbers.' },
  { name: 'Bibek Bista', role: 'Co-Founder & Developer', focus: ['Platform', 'Backend systems'], bio: 'Bibek works on PlumbPro\'s platform and backend systems, focused on keeping the marketplace reliable — real availability, real verification, real data.' },
];

const PILLARS = [
  ['01', 'users', 'Simple for customers', 'Request a service, provide the required details and keep track of booking status from one account.'],
  ['02', 'wrench', 'Clear for plumbers', 'Assigned work, customer details and job progress are presented in one focused workspace.'],
  ['03', 'shield', 'Manageable for our team', 'Our platform team can oversee users, bookings, services and incoming contact messages without navigating disconnected tools.'],
];

const STATEMENT = 'Professional service should feel predictable.';

function Words({ text, base = 0, step = 0.07 }) {
  return text.split(' ').map((w, i) => (
    <span className="ab-word" key={i}><span style={{ animationDelay: `${base + i * step}s` }}>{w}</span>{' '}</span>
  ));
}

// 3D tilt + moving glare. Pure presentation: sets CSS variables from the pointer.
function TiltCard({ children, className }) {
  const ref = useRef(null);
  const move = e => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${((0.5 - y) * 12).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - 0.5) * 14).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
  };
  const leave = () => {
    const el = ref.current; if (!el) return;
    ['--rx', '--ry'].forEach(k => el.style.setProperty(k, '0deg'));
  };
  return <div className={className} ref={ref} onMouseMove={move} onMouseLeave={leave}>{children}</div>;
}

function About() {
  useSEO({
    title: 'About PlumbPro',
    description: 'PlumbPro is a location-aware plumbing service marketplace built in Nepal by two student developers, Anil Gupta and Bibek Bista.',
    path: '/about',
  });
  return <main className="about-page">
    <section className="ab-hero">
      <div className="ab-hero-bg" aria-hidden="true"><i /><i /><i /></div>
      <div className="ab-hero-copy">
        <span className="eyebrow ab-rise" style={{ animationDelay: '.05s' }}>ABOUT PLUMBPRO</span>
        <h1><Words text="Plumbing service, organized around" base={0.15} /><span className="ab-hl"><Words text="trust." base={0.65} /></span></h1>
        <p className="ab-rise" style={{ animationDelay: '.85s' }}>PlumbPro is a service-management platform designed to make booking, communication and job tracking clearer for customers and plumbing professionals.</p>
        <div className="about-actions ab-rise" style={{ animationDelay: '1s' }}>
          <Link to="/services" className="about-primary">Explore services</Link>
          <Link to="/contact" className="about-secondary">Talk to us</Link>
        </div>
      </div>

      <div className="ab-diagram">
        <svg viewBox="0 0 420 420" aria-hidden="true">
          <circle className="ab-orbit" cx="210" cy="210" r="176" />
          <circle className="ab-orbit ab-orbit-2" cx="210" cy="210" r="118" />
          <path id="abPipeA" className="ab-pipe" d="M210 96 L210 180" />
          <path id="abPipeB" className="ab-pipe" d="M210 210 L120 300 L120 330" />
          <path id="abPipeC" className="ab-pipe" d="M210 210 L300 300 L300 330" />
          <circle className="ab-flow" r="4.5"><animateMotion dur="2.4s" repeatCount="indefinite" path="M210 96 L210 180" /></circle>
          <circle className="ab-flow" r="4.5"><animateMotion dur="2.8s" begin=".4s" repeatCount="indefinite" path="M210 210 L120 300 L120 330" /></circle>
          <circle className="ab-flow" r="4.5"><animateMotion dur="2.8s" begin="1s" repeatCount="indefinite" path="M210 210 L300 300 L300 330" /></circle>
          <circle className="ab-core-ring" cx="210" cy="210" r="30" />
        </svg>
        <div className="ab-core"><img src="/plumbpro-mark.svg" alt="" /></div>
        <span className="ab-node ab-node-a"><Icon name="users" size={18} /><b>Customer requests</b></span>
        <span className="ab-node ab-node-b"><Icon name="wrench" size={18} /><b>Plumber delivers</b></span>
        <span className="ab-node ab-node-c"><Icon name="shield" size={18} /><b>Platform oversees</b></span>
      </div>
    </section>

    <section className="ab-pillars" data-reveal>
      {PILLARS.map(([n, icon, title, text], i) => (
        <article className="ab-pillar" key={n} style={{ '--d': `${i * 0.14}s` }}>
          <div className="ab-pillar-top"><span className="ab-pillar-icon"><Icon name={icon} size={22} /></span><span className="ab-pillar-n">{n}</span></div>
          <h2>{title}</h2>
          <p>{text}</p>
          <i className="ab-pillar-line" aria-hidden="true" />
        </article>
      ))}
    </section>

    <section className="ab-approach" data-reveal>
      <span className="eyebrow">OUR APPROACH</span>
      <h2 className="ab-statement" aria-label={STATEMENT}>{STATEMENT.split(' ').map((w, i) => <span key={i} style={{ '--i': i }}>{w} </span>)}</h2>
      <div className="ab-approach-cols">
        <p>We focus on clear status updates, useful information, responsive interfaces and real data from the platform rather than decorative or fabricated activity.</p>
        <p>PlumbPro can evolve as the service grows, while keeping the core experience understandable for every role.</p>
      </div>
    </section>

    <section className="ab-team" data-reveal>
      <div className="ab-team-head">
        <span className="eyebrow">THE TEAM</span>
        <h2>Built by two students, end to end.</h2>
        <p>PlumbPro is designed and built by two students as a real, working product — not a class exercise left unfinished.</p>
      </div>
      <div className="ab-team-grid">
        {developers.map((dev, i) => (
          <TiltCard className="ab-dev" key={dev.name}>
            <div className="ab-dev-inner" style={{ '--d': `${i * 0.18}s` }}>
              <div className="ab-dev-glare" aria-hidden="true" />
              <div className="ab-dev-avatar" aria-hidden="true">
                <i className="ab-ring ab-ring-1" /><i className="ab-ring ab-ring-2" />
                <span className="ab-sat ab-sat-1" /><span className="ab-sat ab-sat-2" />
                <b>{dev.name.split(' ').map(n => n[0]).join('')}</b>
              </div>
              <h3>{dev.name}</h3>
              <span className="ab-dev-role">{dev.role}</span>
              <p className="ab-dev-bio">{dev.bio}</p>
              <div className="ab-dev-tags">{dev.focus.map(f => <span key={f}>{f}</span>)}</div>
            </div>
          </TiltCard>
        ))}
      </div>
    </section>

    <section className="ab-cta" data-reveal>
      <h2>Ready to see it in action?</h2>
      <p>Browse the services or get in touch with the team.</p>
      <div className="about-actions"><Link to="/book-plumber" className="about-primary">Book a plumber</Link><Link to="/contact" className="about-secondary">Contact us</Link></div>
    </section>
  </main>;
}
export default About;
