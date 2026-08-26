import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Legal.css';

function Privacy() {
  return <main className="legal-page">
    <div className="legal-hero"><span className="eyebrow">LEGAL</span><h1>Privacy Policy</h1><p>Last updated: August 23, 2026</p></div>
    <article className="legal-card">
      <h2>1. Information we collect</h2>
      <p>When you use PlumbPro, we collect the information needed to run the service: your name, email, phone number, and — depending on your role — booking details, service requests, reviews, and messages you send through the contact form. Plumber accounts additionally include profession, experience, service area and availability.</p>
      <h2>2. Location information</h2>
      <p>We only access your device location after you take a clear action, like tapping "Use my location." We use those coordinates to match you with plumbers who can reach you and to show distance — nothing more. You can always search by typing an area or city instead, and skip location sharing entirely.</p>
      <h2>3. How we use your information</h2>
      <p>We use it to authenticate your account, process and track bookings, connect customers with plumbers, respond to messages sent through the contact form, and operate day-to-day administration of the platform — like verifying plumber profiles.</p>
      <h2>4. Who can see it</h2>
      <p>Customers and plumbers see the information needed to complete a booking together — name, contact details, service address and job status. PlumbPro administrators can access account and booking records to verify plumbers, resolve issues, and keep the platform running smoothly. We don't sell your information or share it with advertisers.</p>
      <h2>5. Security</h2>
      <p>Passwords are stored using one-way hashing — we never store or display your actual password, and no one at PlumbPro can look it up. Please don't include passwords or payment details in messages or booking notes.</p>
      <h2>6. Retention</h2>
      <p>We keep account and booking information for as long as your account is active and for a reasonable period after, so booking history, reviews and support records stay available and accurate.</p>
      <h2>7. Third-party services</h2>
      <p>When you use "Use my location," we may resolve your coordinates into a readable place name using OpenStreetMap's Nominatim service. That lookup is subject to OpenStreetMap's own usage policy.</p>
      <h2>8. Your choices</h2>
      <p>You can update your account and profile details at any time from your dashboard. To request a copy of your data or ask us to delete your account, reach out through the <Link to="/contact">Contact page</Link>.</p>
      <h2>9. Changes to this policy</h2>
      <p>If we make a meaningful change to how we handle your information, we'll update this page and change the date at the top.</p>
    </article>
  </main>;
}
export default Privacy;
