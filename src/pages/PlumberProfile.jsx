import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import Stars from '../components/Stars';
import ReportPlumberModal from '../components/ReportPlumberModal';
import { getPublicPlumberProfile } from '../api/plumberApi';
import { getReviewableBooking, createReview } from '../api/reviewApi';
import { useAuth } from '../context/AuthContext';
import { useSEO } from '../hooks/useSEO';
import '../styles/PlumberProfile.css';

function RatingBar({ stars, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rating-bar-row">
      <span className="rating-bar-label">{stars}<Icon name="star" size={11} filled /></span>
      <div className="rating-bar-track"><div className={`rating-bar-fill fill-${pct >= 90 ? '100' : pct >= 65 ? '75' : pct >= 40 ? '50' : pct >= 15 ? '25' : pct > 0 ? '10' : '0'}`} /></div>
      <span className="rating-bar-count">{count}</span>
    </div>
  );
}

function PlumberProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reviewable, setReviewable] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [section, setSection] = useState('about');

  useEffect(() => {
    setLoading(true);
    getPublicPlumberProfile(id).then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    getReviewableBooking(id).then(d => setReviewable(d.booking)).catch(() => {});
  }, [id, user]);

  useSEO({
    title: data?.profile?.name ? `${data.profile.name} — Plumber Profile` : 'Plumber Profile',
    description: data?.profile ? `${data.profile.name}, ${data.profile.profession} in ${data.profile.location_name}. See real reviews and book directly on PlumbPro.` : undefined,
    path: `/plumbers/${id}`,
  });

  const breakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    (data?.reviews || []).forEach(r => { counts[r.rating] = (counts[r.rating] || 0) + 1; });
    return counts;
  }, [data]);

  const requestReport = () => {
    if (!user) { navigate('/login', { state: { from: `/plumbers/${id}` } }); return; }
    setReporting(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewBusy(true);
    setReviewMessage('');
    try {
      await createReview({ booking_id: reviewable.id, rating: Number(reviewForm.rating), comment: reviewForm.comment });
      setReviewMessage('Thanks — your review is live below.');
      setReviewOpen(false);
      setReviewable(null);
      const refreshed = await getPublicPlumberProfile(id);
      setData(refreshed);
    } catch (err) {
      setReviewMessage(err.message);
    } finally {
      setReviewBusy(false);
    }
  };

  if (loading) return <main className="plumber-profile-page"><div className="profile-skeleton"><div className="ps-avatar" /><div className="ps-lines"><span /><span /><span /></div></div></main>;
  if (error || !data?.profile) return <main className="plumber-profile-page"><div className="form-error">{error || 'Plumber not found.'}</div></main>;

  const p = data.profile;
  const maxCount = Math.max(1, ...Object.values(breakdown));

  return (
    <main className="plumber-profile-page">
      <nav className="profile-breadcrumb"><Link to="/#find-plumber">← Back to search</Link></nav>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-avatar">
              {p.photo_url ? <img src={p.photo_url} alt={p.name} /> : <span>{(p.name || 'P').charAt(0).toUpperCase()}</span>}
            </div>
            <div className="profile-name-row">
              <h1>{p.name}</h1>
              {p.verified ? <span className="verified-badge"><Icon name="shieldCheck" size={13} /> Verified</span> : null}
            </div>
            <p className="profile-profession">{p.profession}</p>
            <Stars rating={p.rating} count={p.review_count} size={14} />
            <ul className="profile-quick-facts">
              <li><Icon name="mapPin" size={14} /> {p.location_name}</li>
              <li><Icon name="check" size={14} /> {p.completed_jobs} job{p.completed_jobs === 1 ? '' : 's'} completed</li>
              <li><Icon name="clock" size={14} /> {Number(p.experience_years || 0)} years experience</li>
              <li><Icon name="briefcase" size={14} /> {p.work_mode === 'team' ? 'Works with a team' : 'Works solo'}</li>
            </ul>
            <Link to="/book-plumber" state={{ plumberId: p.id, plumberName: p.name }} className="btn-primary profile-book-btn">Book {p.name.split(' ')[0]}</Link>
            <button type="button" className="profile-report-link" onClick={requestReport}><Icon name="close" size={13} /> Report this plumber</button>
          </div>
        </aside>

        <div className="profile-main">
          <div className="profile-tabs" role="tablist">
            <button type="button" className={section === 'about' ? 'active' : ''} onClick={() => setSection('about')}>About</button>
            <button type="button" className={section === 'reviews' ? 'active' : ''} onClick={() => setSection('reviews')}>Reviews ({data.reviews.length})</button>
          </div>

          {section === 'about' && <>
            {p.bio && <section className="profile-section"><h2>About</h2><p>{p.bio}</p></section>}
            <section className="profile-section">
              <h2>Background</h2>
              <dl className="profile-facts">
                {p.education && <div><dt>Education / training</dt><dd>{p.education}</dd></div>}
                {p.certifications && <div><dt>Certifications</dt><dd>{p.certifications}</dd></div>}
                <div><dt>Work style</dt><dd>{p.work_mode === 'team' ? 'Works with a team' : 'Works solo'}</dd></div>
                <div><dt>Service coverage</dt><dd>{p.can_travel ? 'Can travel beyond usual area' : `Within ${Number(p.service_radius_km || 0)} km`}</dd></div>
              </dl>
            </section>
          </>}

          {section === 'reviews' && <section className="profile-section">
            {reviewMessage && <div className={reviewMessage.startsWith('Thanks') ? 'form-success' : 'form-error'}>{reviewMessage}</div>}

            {reviewable && !reviewOpen && (
              <div className="reviewable-banner">
                <div><strong>You completed a job with {p.name.split(' ')[0]}</strong><span>Leave a quick review to help the next customer choose well.</span></div>
                <button type="button" className="btn-primary" onClick={() => setReviewOpen(true)}>Leave a review</button>
              </div>
            )}
            {reviewOpen && (
              <form className="inline-review-form" onSubmit={submitReview}>
                <label>Rating
                  <select value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })}>
                    <option value="5">5 — Excellent</option>
                    <option value="4">4 — Good</option>
                    <option value="3">3 — Average</option>
                    <option value="2">2 — Needs improvement</option>
                    <option value="1">1 — Poor</option>
                  </select>
                </label>
                <label>Comment<textarea rows="3" value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Share a short, honest review." /></label>
                <div className="inline-review-actions">
                  <button type="button" className="btn-secondary" onClick={() => setReviewOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={reviewBusy}>{reviewBusy ? 'Submitting…' : 'Submit review'}</button>
                </div>
              </form>
            )}

            {data.reviews.length > 0 && (
              <div className="rating-breakdown">
                {[5, 4, 3, 2, 1].map(n => <RatingBar key={n} stars={n} count={breakdown[n] || 0} total={maxCount} />)}
              </div>
            )}

            {data.reviews.length === 0 && <p className="profile-empty">No reviews yet — be the first to book and review.</p>}
            <div className="profile-reviews">
              {data.reviews.map((r, i) => (
                <div className="profile-review" key={i}>
                  <div className="profile-review-top">
                    <strong>{r.customer_name}</strong>
                    <Stars rating={r.rating} count={1} showCount={false} size={12} />
                  </div>
                  {r.comment && <p>{r.comment}</p>}
                  <small>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                </div>
              ))}
            </div>
          </section>}
        </div>
      </div>

      {reporting && <ReportPlumberModal plumberId={p.id} onClose={() => setReporting(false)} />}
    </main>
  );
}
export default PlumberProfile;
