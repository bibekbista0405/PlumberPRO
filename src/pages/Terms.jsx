import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Legal.css';

function Terms() {
  return <main className="legal-page">
    <div className="legal-hero"><span className="eyebrow">LEGAL</span><h1>Terms & Conditions</h1><p>Last updated: August 23, 2026</p></div>
    <article className="legal-card">
      <h2>1. Using PlumbPro</h2>
      <p>PlumbPro connects customers who need plumbing work with independent plumbers who can serve their area. By creating an account or submitting a booking, you agree to provide accurate information and to use the platform lawfully.</p>
      <h2>2. Accounts</h2>
      <p>You're responsible for keeping your login credentials confidential and for any activity carried out through your account. Plumber accounts go through a platform verification step before they're shown in public search. Our team may create or manage accounts as part of running the platform.</p>
      <h2>3. Bookings</h2>
      <p>Submitting a booking sends a request to a plumber (or to our team for assignment); it becomes a confirmed job once the plumber accepts. Availability, scheduling and final pricing are agreed between you and the plumber, and either side can update a booking's status as the job progresses — cancel, accept, reschedule, or mark it complete.</p>
      <h2>4. Plumber conduct and verification</h2>
      <p>Plumbers must provide accurate profile information — profession, experience, service area and availability — and keep it up to date. We reserve the right to remove verification or suspend an account that provides false information, fails to honor accepted bookings, or otherwise misuses the platform.</p>
      <h2>5. Reviews</h2>
      <p>Customers may leave a rating and review after a booking is completed. Reviews should reflect a genuine experience with the service. We may remove reviews that are abusive, fraudulent or unrelated to an actual booking.</p>
      <h2>6. Acceptable use</h2>
      <p>Don't submit false information, attempt to access accounts or data that aren't yours, interfere with the platform's operation, or use PlumbPro for anything unlawful.</p>
      <h2>7. Changes to the service</h2>
      <p>We may update, extend or temporarily interrupt features as PlumbPro evolves. We'll use reasonable efforts to avoid disrupting bookings that are already in progress.</p>
      <h2>8. Liability</h2>
      <p>Plumbers on PlumbPro are independent professionals, not PlumbPro employees. We facilitate the connection, booking and tracking between customers and plumbers, but the quality and outcome of the plumbing work itself is between the customer and the plumber who performed it.</p>
      <h2>9. Contact</h2>
      <p>Questions about these terms can be sent through our <Link to="/contact">Contact page</Link>.</p>
    </article>
  </main>;
}
export default Terms;
