import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Legal.css';

function Legal() {
  return <main className="legal-page">
    <div className="legal-hero"><span className="eyebrow">LEGAL CENTER</span><h1>Legal & Disclaimers</h1><p>How PlumbPro works, and where the responsibility sits.</p></div>
    <article className="legal-card">
      <h2>What PlumbPro is</h2>
      <p>PlumbPro is a booking platform that connects customers with independent, platform-verified plumbers operating in their area. We handle discovery, booking, status tracking and reviews — the plumbing work itself is carried out by the plumber you book, not by PlumbPro directly.</p>
      <h2>Service outcomes</h2>
      <p>A confirmed booking means a plumber has accepted your request; it isn't a guarantee of a particular price, timeline or outcome, since every job depends on what's found on site. Any pricing, scope or timing details should be agreed directly with your plumber.</p>
      <h2>Verification</h2>
      <p>Plumbers go through a platform review before their profile appears in search — we check the professional details they submit, such as experience and service area. Verification reflects the information provided at the time of review; it isn't a certification of every individual job.</p>
      <h2>Keeping your information accurate</h2>
      <p>Please keep your account, booking and contact details current — accurate addresses and phone numbers help plumbers reach you, and accurate profiles help customers choose the right plumber.</p>
      <h2>If something goes wrong</h2>
      <p>You can report a plumber directly from their profile or from any booking — it goes straight to our support team, and we follow up with you on the outcome. See the <Link to="/cancellation-policy">Cancellation Policy & Service Assurance</Link> page for the full detail on cancellations, reports, and what verification does and doesn't cover.</p>
      <h2>Related policies</h2>
      <p>See our <Link to="/terms">Terms & Conditions</Link> for the rules of using PlumbPro, and our <Link to="/privacy">Privacy Policy</Link> for how we handle your information.</p>
    </article>
  </main>;
}
export default Legal;
