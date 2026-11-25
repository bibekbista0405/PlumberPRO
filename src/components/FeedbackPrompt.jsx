import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import { getMyFeedback, submitFeedback } from '../api/feedbackApi';
import '../styles/FeedbackPrompt.css';

const DISMISS_KEY = 'plumbpro:feedback-dismissed-at';
const DISMISS_COOLDOWN_DAYS = 14;
const EXIT_ANIMATION_MS = 260;

// Shown only when there's something real to ask about (a completed booking
// or job) — asking right after a genuinely finished piece of work is when
// people are most willing to give an honest, useful answer, not a random
// interruption mid-task.
function FeedbackPrompt({ role, hasCompletedWork }) {
  const [existing, setExisting] = useState(undefined); // undefined = still loading
  const [dismissed, setDismissed] = useState(false);
  const [closing, setClosing] = useState(false);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasCompletedWork) { setExisting(null); return; }
    getMyFeedback().then(d => setExisting(d.feedback)).catch(() => setExisting(null));
    try {
      const last = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (last && Date.now() - last < DISMISS_COOLDOWN_DAYS * 86400000) setDismissed(true);
    } catch { /* ignore */ }
  }, [hasCompletedWork]);

  // Plays a short exit transition before actually unmounting, instead of the
  // card just vanishing — matters more here than elsewhere since dismissing
  // is a very small, frequent interaction and an abrupt cut feels jarring.
  const closeWithAnimation = (after) => {
    setClosing(true);
    window.setTimeout(() => { after(); }, EXIT_ANIMATION_MS);
  };

  const dismiss = () => {
    closeWithAnimation(() => {
      setDismissed(true);
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { setError('Pick a star rating first.'); return; }
    setBusy(true);
    setError('');
    try {
      await submitFeedback(rating, comment);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!hasCompletedWork || existing === undefined || existing || dismissed) return null;

  if (done) {
    return (
      <div className="feedback-prompt feedback-prompt-done">
        <div className="feedback-done-badge">
          <span className="feedback-done-burst" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => <i key={i} className={`burst-dot burst-dot-${i}`} />)}
          </span>
          <Icon name="check" size={18} />
        </div>
        <span>Thanks — if we approve it, your feedback will show up on the PlumbPro homepage.</span>
      </div>
    );
  }

  return (
    <div className={`feedback-prompt ${closing ? 'is-closing' : 'is-entering'}`}>
      {!open ? (
        <>
          <div className="feedback-prompt-copy">
            <strong>{role === 'plumber' ? 'How has PlumbPro been for you so far?' : "How's your experience with PlumbPro been?"}</strong>
            <span>A quick rating helps us — and if you're up for it, great feedback gets featured on our homepage.</span>
          </div>
          <div className="feedback-prompt-actions">
            <button type="button" className="btn-primary" onClick={() => setOpen(true)}>Give feedback</button>
            <button type="button" className="feedback-dismiss" onClick={dismiss} aria-label="Not now"><Icon name="close" size={14} /></button>
          </div>
        </>
      ) : (
        <form onSubmit={submit} className="feedback-prompt-form">
          <div className="feedback-stars" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map(n => {
              const active = n <= (hoverRating || rating);
              return (
                <button
                  type="button"
                  key={n}
                  className={`${active ? 'on' : ''} ${n === rating ? 'just-picked' : ''}`}
                  onMouseEnter={() => setHoverRating(n)}
                  onFocus={() => setHoverRating(n)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                >
                  <Icon name="star" size={24} filled={active} />
                </button>
              );
            })}
          </div>
          <textarea rows="2" value={comment} onChange={e => setComment(e.target.value)} placeholder="Anything you'd add? (optional)" maxLength={1000} />
          {error && <div className="form-error">{error}</div>}
          <div className="feedback-prompt-actions">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Submit feedback'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
export default FeedbackPrompt;
