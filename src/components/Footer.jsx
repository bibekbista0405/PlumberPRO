import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

function Footer() {
  return <footer className="footer">
    <div className="footer-container">
      <div className="footer-brand">
        <img src="/plumbpro-mark.svg" alt="PlumbPro logo" /><span className="footer-wordmark">Plumb<span>Pro</span></span>
        <p>Professional plumbing service management for customers and plumbers.</p>
      </div>
      <div className="footer-box"><h3>Explore</h3><Link to="/services">Services</Link><Link to="/about">About</Link><Link to="/blog">Blog</Link><Link to="/book-plumber">Book a Plumber</Link><Link to="/contact">Contact</Link></div>
      <div className="footer-box"><h3>Legal</h3><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms & Conditions</Link><Link to="/legal">Legal & Disclaimers</Link><Link to="/cancellation-policy">Cancellation Policy</Link></div>
      <div className="footer-box"><h3>Contact</h3><p>Need help with a booking or account?</p><Link to="/contact" className="footer-contact-link">Contact support →</Link></div>
    </div>
    <div className="footer-bottom"><span>© 2026 PlumbPro. Founded by Anil Gupta & Bibek Bista.</span><span>Built for a better service experience.</span></div>
  </footer>;
}
export default Footer;
