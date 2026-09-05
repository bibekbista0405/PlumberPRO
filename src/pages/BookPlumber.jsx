import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/BookPlumber.css';
import { getServices } from '../api/serviceApi';
import { createBooking, uploadBookingPhoto } from '../api/bookingApi';
import { searchPlumbers } from '../api/plumberApi';
import { useAuth } from '../context/AuthContext';
import { useFormCache } from '../hooks/useFormCache';
import Icon from '../components/Icon';
import Stars from '../components/Stars';
import BookingSuccess from '../components/BookingSuccess';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [booking, setBooking, clearBookingCache] = useFormCache('book-plumber-form', emptyForm);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    Promise.all([getServices(), searchPlumbers({})])
      .then(([s, p]) => { setServices(s.services || []); setPlumbers(p.plumbers || []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (preselected) setBooking(v => ({ ...v, plumber_id: preselected })); }, [preselected, setBooking]);

  const change = e => setBooking(v => ({ ...v, [e.target.name]: e.target.value }));
  const pickPhoto = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };
  const clearPhoto = () => { setPhoto(null); setPhotoPreview(''); };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!user) {
      // The form is already saved to local cache as the person types, so nothing is lost here.
      navigate('/login', { state: { from: '/book-plumber' } });
      return;
    }
    setBusy(true);
    try {
      const chosenPlumber = booking.plumber_id ? plumbers.find(p => String(p.id) === String(booking.plumber_id)) : null;
      const created = await createBooking({
        service_id: Number(booking.service_id),
        plumber_id: booking.plumber_id ? Number(booking.plumber_id) : null,
        address: booking.address,
        booking_date: booking.date,
        booking_time: booking.time,
        description: booking.description,
      });
      if (photo && created?.booking?.id) {
        try { await uploadBookingPhoto(created.booking.id, photo); } catch { /* booking still succeeded; photo can be added later from the dashboard */ }
      }
      clearBookingCache();
      clearPhoto();
      setSuccess({ plumberName: chosenPlumber?.name || null });
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

      <form className="booking-box" onSubmit={submit}>
        <div className="booking-grid">
          <label>Service
            <select name="service_id" value={booking.service_id} onChange={change} required>
              <option value="">Choose a service</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} · {s.is_negotiable ? 'Negotiable at the job' : `NPR ${Number(s.price || 0).toLocaleString()}`}</option>)}
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
          <label className="wide-field">Photo of the problem (optional)
            <div className="photo-pick-row">
              {photoPreview ? (
                <div className="photo-pick-preview"><img src={photoPreview} alt="Selected" /><button type="button" onClick={clearPhoto}><Icon name="close" size={13} /></button></div>
              ) : (
                <label className="photo-upload-btn">Attach a photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickPhoto} hidden /></label>
              )}
              <span className="photo-upload-hint">A photo often gets you a faster, more accurate response.</span>
            </div>
          </label>
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
      {success && <BookingSuccess booking={success} onClose={() => setSuccess(null)} />}
    </main>
  );
}
export default BookPlumber;
