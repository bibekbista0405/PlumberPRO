import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import '../styles/Marketing.css';

const PERKS = ['Create a profile customers can trust', 'Get verified by the PlumbPro team', 'Receive booking requests near you', 'Message customers and manage every job', 'Build your reputation with real reviews'];

function PlumberCTA() {
  return (
    <section className="mk-section mk-plumber" data-reveal>
      <div className="mk-plumber-card">
        <div className="mk-plumber-art" aria-hidden="true">
          <i className="mk-ring mk-ring-1" /><i className="mk-ring mk-ring-2" /><i className="mk-ring mk-ring-3" />
          <span className="mk-orbit mk-orbit-1"><Icon name="wrench" size={20} /></span>
          <span className="mk-orbit mk-orbit-2"><Icon name="droplet" size={20} /></span>
          <span className="mk-orbit mk-orbit-3"><Icon name="bolt" size={20} /></span>
          <div className="mk-plumber-core"><img src="/plumbpro-mark.svg" alt="" /></div>
        </div>
        <div className="mk-plumber-copy">
          <span className="eyebrow">FOR PLUMBERS</span>
          <h2>Grow your plumbing work with PlumbPro.</h2>
          <p>Be found by customers who need help now, and keep every booking organised in one workspace.</p>
          <ul>{PERKS.map(p => <li key={p}><Icon name="check" size={15} />{p}</li>)}</ul>
          <div className="mk-plumber-actions">
            <Link to="/login" className="mk-btn-light">Join as a plumber <Icon name="arrowUpRight" size={16} /></Link>
            <Link to="/about" className="mk-btn-ghost">Learn more</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
export default PlumberCTA;
