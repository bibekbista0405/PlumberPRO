import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import '../styles/Footer.css';

function Footer() {
  return <footer className="footer">
    <div className="footer-cta-wrap"><div className="footer-cta"><div className="footer-cta-orbit footer-cta-orbit-one"/><div className="footer-cta-orbit footer-cta-orbit-two"/><div className="footer-cta-copy"><span className="footer-kicker">THE PLUMBPRO PROMISE</span><h2>Good service starts with a better connection.</h2><p>Find the right plumbing help, make a booking, and keep the details in one place.</p></div><Link to="/book-plumber" className="footer-cta-button">Find your plumber <Icon name="arrowUpRight" size={17}/></Link></div></div>
    <div className="footer-container">
      <div className="footer-brand">
        <div className="footer-brand-lockup"><img src="/plumbpro-mark.svg" alt="PlumbPro logo" /><span className="footer-wordmark">Plumb<span>Pro</span></span></div>
        <p>Professional plumbing service management for customers and plumbers.</p>
      </div>
      <div className="footer-box"><h3>Explore</h3><Link to="/services">Services</Link><Link to="/about">About</Link><Link to="/blog">Blog</Link><Link to="/book-plumber">Book a Plumber</Link><Link to="/contact">Contact</Link></div>
      <div className="footer-box"><h3>Legal</h3><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms & Conditions</Link><Link to="/legal">Legal & Disclaimers</Link><Link to="/cancellation-policy">Cancellation Policy</Link></div>
      <div className="footer-box"><h3>Contact</h3><p>Need help with a booking or account?</p><Link to="/contact" className="footer-contact-link">Contact support →</Link></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} PlumbPro. All rights reserved.</span><span className="footer-bottom-note"><i/> Built for a better service experience.</span><Link to="/privacy">Your privacy matters <Icon name="arrowUpRight" size={13}/></Link></div>
  </footer>;
}
export default Footer;
