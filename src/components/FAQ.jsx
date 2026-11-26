import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import '../styles/Marketing.css';

const QA = [
  ['How does booking a plumber work?', 'Search by location or service, choose a plumber, and send a request describing the job. You can follow the booking through each stage from your dashboard.'],
  ['What does “verified” mean?', 'Plumbers shown as verified have been checked by the PlumbPro platform team. Only verified plumbers carry the verified badge in local search.'],
  ['Can I message my plumber?', 'Yes. Once you have a booking, you can message the plumber directly from your dashboard, so details stay in one place.'],
  ['Can I leave a review?', 'After a job is completed you can review the work, and approved reviews help other customers choose.'],
  ['What if I need to cancel?', 'Cancellation rules are set out in our Cancellation Policy, so you can check them before you book.'],
  ['I am a plumber. How do I join?', 'Create an account as a plumber, complete your profile and service area, and our team will review it for verification.'],
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="mk-section mk-faq" data-reveal>
      <div className="mk-head mk-head-left">
        <span className="eyebrow">QUESTIONS</span>
        <h2>Good to know before you book.</h2>
        <p>Still unsure? <Link to="/contact">Contact our team</Link> — we are happy to help.</p>
      </div>
      <div className="mk-faq-list">
        {QA.map(([q, a], i) => (
          <div className={`mk-faq-item ${open === i ? 'open' : ''}`} key={q}>
            <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{q}</span><Icon name="plus" size={18} />
            </button>
            <div className="mk-faq-body"><div><p>{a}</p></div></div>
          </div>
        ))}
      </div>
    </section>
  );
}
export default FAQ;
