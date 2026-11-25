import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Legal.css';
import { useSEO } from '../hooks/useSEO';

function CancellationPolicy() {
  useSEO({
    title: 'Cancellation Policy & Service Assurance',
    description: 'How booking cancellations, disputes and reports work on PlumbPro.',
    path: '/cancellation-policy',
  });
  return <main className="legal-page">
    <div className="legal-hero"><span className="eyebrow">LEGAL</span><h1>Cancellation Policy & Service Assurance</h1><p>Last updated: August 31, 2026</p></div>
    <article className="legal-card">
      <h2>1. Cancelling a booking</h2>
      <p>You can cancel a booking yourself at any point before the plumber starts the job — while it's pending, assigned, confirmed, or the plumber is on the way. Once a job is marked "in progress," it can no longer be cancelled from your dashboard, since work has already begun.</p>
      <h2>2. Payment and refunds</h2>
      <p>PlumbPro does not currently process payments — any payment for completed work happens directly between you and your plumber, the same way it would if you found them any other way. Because we don't hold or process funds, there's no PlumbPro "refund" to issue. Pricing and any refund for unsatisfactory work is a conversation between you and your plumber; our support team can help mediate a dispute (see below), but doesn't issue payments.</p>
      <h2>3. If a plumber cancels or doesn't show up</h2>
      <p>If your assigned plumber cancels or doesn't show up for a confirmed booking, you can immediately search for another available plumber and rebook. You can also report the plumber directly from the booking — see below.</p>
      <h2>4. Reporting a problem</h2>
      <p>If something goes wrong with a plumber's conduct — a no-show, unprofessional behavior, being overcharged unexpectedly, or a safety concern — you can report it directly from that plumber's profile or from the booking itself. Every report goes straight to our support team, not the plumber, and we follow up on the outcome once we've looked into it.</p>
      <h2>5. What "verified" does and doesn't cover</h2>
      <p>A verified badge means a plumber's submitted professional details were reviewed by the platform. It is not a guarantee of the outcome of any individual job — the same way a driver's license doesn't guarantee every trip goes perfectly. It's one real signal among several (reviews, completed job count, experience) to help you choose.</p>
      <h2>6. Questions</h2>
      <p>For anything not covered here, reach out through our <Link to="/contact">Contact page</Link>.</p>
    </article>
  </main>;
}
export default CancellationPolicy;
