import React, { useState } from 'react';
import Icon from './Icon';
import { REPORT_REASONS, submitReport } from '../api/reportApi';
import '../styles/ReportModal.css';

function ReportPlumberModal({ plumberId, bookingId = null, onClose }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!reason) { setError('Please choose a reason.'); return; }
    setBusy(true);
    setError('');
    try {
      await submitReport({ plumber_id: plumberId, booking_id: bookingId, reason, description });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="report-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="report-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="report-close" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
        {done ? (
          <div className="report-done">
            <div className="report-done-icon"><Icon name="check" size={22} /></div>
            <h3>Report sent</h3>
            <p>Our support team will review this and follow up if needed. Thank you for flagging it.</p>
            <button type="button" className="btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <h3>Report this plumber</h3>
            <p className="report-intro">Tell us what happened. This goes directly to PlumbPro support, not to the plumber.</p>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={submit}>
              <label>Reason
                <select value={reason} onChange={(e) => setReason(e.target.value)} required>
                  <option value="">Select a reason</option>
                  {REPORT_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
              <label>What happened? (optional, but helpful)
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" maxLength="2000" placeholder="Share any details that would help our support team look into this." />
              </label>
              <div className="report-actions">
                <button type="button" className="btn-secondary report-cancel" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Submit report'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
export default ReportPlumberModal;
