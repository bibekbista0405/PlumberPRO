import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/BookPlumber.css';
import { getServices } from '../api/serviceApi';
import { createBooking } from '../api/bookingApi';
import { searchPlumbers } from '../api/plumberApi';
import { useAuth } from '../context/AuthContext';
import { useFormCache } from '../hooks/useFormCache';
import Icon from '../components/Icon';
import Stars from '../components/Stars';

const emptyForm = { address: '', service_id: '', plumber_id: '', date: '', time: '', description: '' };

function BookPlumber() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const preselected = location.state?.plumberId;

  const [services, setServices] = useState([]);
  const [plumbers, setPlumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [booking, setBooking, clearBookingCache] = useFormCache('book-plumber-form', emptyForm);

  useEffect(() => {
    Promise.all([getServices(), searchPlumbers({})])
      .then(([s, p]) => { setServices(s.services || []); setPlumbers(p.plumbers || []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (preselected) setBooking(v => ({ ...v, plumber_id: preselected })); }, [preselected, setBooking]);

  const change = e => setBooking(v => ({ ...v, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (!user) {
      // The form is already saved to local cache as the person types, so nothing is lost here.
      navigate('/login', { state: { from: '/book-plumber' } });
      return;
    }
    setBusy(true);
    try {
      await createBooking({
        service_id: Number(booking.service_id),
        plumber_id: booking.plumber_id ? Number(booking.plumber_id) : null,
        address: booking.address,
        booking_date: booking.date,
        booking_time: booking.time,
        description: booking.description,
      });
      setMessage('Booking created successfully. You can track the request from your dashboard.');
      clearBookingCache();
      setBooking(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="booking-container">
      <div className="booking-intro">
        <span className="eyebrow">BOOK A SERVICE</span>
        <h1>Tell us what you need.</h1>
        <p>Choose a service, optionally select a verified plumber, and send a real booking request to the PlumbPro system.</p>
      </div>

      {!user && (
        <div className="auth-gate" role="status">
          <div className="auth-gate-icon"><Icon name="shieldCheck" size={20} /></div>
          <div className="auth-gate-copy">
            <strong>Sign in to book a plumber</strong>
            <span>Create a free account or log in first — anything you type below is saved automatically, so you won't lose it.</span>
          </div>
          <div className="auth-gate-actions">
            <Link to="/login" state={{ from: '/book-plumber' }} className="btn-secondary auth-gate-btn">Log in</Link>
            <Link to="/login" state={{ from: '/book-plumber', register: true }} className="btn-primary auth-gate-btn">Create account</Link>
          </div>
        </div>
      )}

      {error && <div className="form-error">{error}</div>}
      {message && <div className="form-success">{message}</div>}

      <form className="booking-box" onSubmit={submit}>
        <div className="booking-grid">
          <label>Service
            <select name="service_id" value={booking.service_id} onChange={change} required>
              <option value="">Choose a service</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} · NPR {Number(s.price || 0).toLocaleString()}</option>)}
            </select>
          </label>
          <label>Preferred plumber
            <select name="plumber_id" value={booking.plumber_id} onChange={change}>
              <option value="">Let PlumbPro assign one</option>
              {plumbers.map(p => <option key={p.id} value={p.id}>{p.name} · {p.location_name} · {Number(p.rating || 0).toFixed(1)}★ ({p.review_count || 0})</option>)}
            </select>
          </label>
          <label>Date<input type="date" name="date" value={booking.date} onChange={change} min={new Date().toISOString().slice(0, 10)} required /></label>
          <label>Preferred time<input type="time" name="time" value={booking.time} onChange={change} required /></label>
          <label className="wide-field">Service address<textarea name="address" value={booking.address} onChange={change} required rows="3" placeholder="House, street, area, city" /></label>
          <label className="wide-field">What do you need help with?<textarea name="description" value={booking.description} onChange={change} rows="4" placeholder="Describe the problem or installation you need." /></label>
        </div>
        {booking.plumber_id && (() => { const p = plumbers.find(pl => String(pl.id) === String(booking.plumber_id)); return p ? (
          <div className="selected-plumber-card">
            <div className="plumber-avatar" aria-hidden="true">{(p.name || 'P').charAt(0).toUpperCase()}</div>
            <div><strong>{p.name}</strong><span>{p.profession || 'Plumbing professional'} · {p.location_name}</span></div>
            <Stars rating={p.rating} count={p.review_count} size={13} />
          </div>
        ) : null; })()}
        <button className="booking-submit" disabled={busy || loading}>
          {busy ? 'Sending request…' : user ? 'Submit booking request' : 'Continue to sign in'}
        </button>
        <p className="booking-note"><Icon name="check" size={13} /> Your progress is saved automatically on this device.</p>
      </form>
    </main>
  );
}
export default BookPlumber;
