import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import '../styles/BookingSuccess.css';

function BookingSuccess({ booking, onClose }) {
  return (
    <div className="booking-success-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="booking-success-title">
      <div className="booking-success-card">
        <button type="button" className="booking-success-dismiss" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
        <div className="booking-success-badge">
          <span className="booking-success-ring" />
          <Icon name="check" size={26} />
        </div>
        <span className="eyebrow">REQUEST SENT</span>
        <h2 id="booking-success-title">You're all set — booking confirmed.</h2>
        <p>{booking?.plumberName
          ? `Your request has been sent to ${booking.plumberName}. You'll get a notification the moment they respond.`
          : "Your request is in. We'll match you with a verified, available plumber and notify you as soon as one accepts."}</p>

        <ol className="booking-success-steps">
          <li><span>1</span><div><strong>Plumber reviews your request</strong><small>Usually within a short while — you'll see it update live.</small></div></li>
          <li><span>2</span><div><strong>You get notified the moment it's accepted</strong><small>Check the bell icon, or your dashboard.</small></div></li>
          <li><span>3</span><div><strong>Track the whole job in one place</strong><small>From "on the way" to "completed" — no guessing.</small></div></li>
        </ol>

        <div className="booking-success-actions">
          <Link to="/customer-dashboard" className="btn-primary">View my bookings</Link>
          <button type="button" className="btn-secondary booking-success-secondary" onClick={onClose}>Book another service</button>
        </div>
      </div>
    </div>
  );
}
export default BookingSuccess;
