const { pool } = require('../config/db');
const { sanitizeFields } = require('../utils/sanitize');
const { createNotification } = require('./notifications');

// One piece of feedback per person — resubmitting just updates it and puts
// it back to "pending" so admin reviews the new version, rather than piling
// up duplicate rows from someone who taps the prompt more than once.
async function submitFeedback(req, res, next) {
  try {
    const clean = sanitizeFields(req.body, ['comment']);
    const rating = Number(req.body.rating);
    const comment = (clean.comment || '').trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }
    if (comment.length > 1000) return res.status(400).json({ message: 'Comment is too long.' });
    if (!['customer', 'plumber'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only customers and plumbers can submit platform feedback.' });
    }

    await pool.query(
      `INSERT INTO platform_feedback (user_id, role, rating, comment, status)
       VALUES (?, ?, ?, ?, 'pending')
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), status = 'pending'`,
      [req.user.id, req.user.role, rating, comment]
    );
    res.status(201).json({ message: 'Thanks for the feedback — our team will take a look.' });
  } catch (err) { next(err); }
}

async function myFeedback(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT id, rating, comment, status, created_at FROM platform_feedback WHERE user_id = ?', [req.user.id]);
    res.json({ feedback: rows[0] || null });
  } catch (err) { next(err); }
}

async function listFeedback(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT pf.*, u.name AS user_name FROM platform_feedback pf JOIN users u ON u.id = pf.user_id ORDER BY pf.created_at DESC LIMIT 500`
    );
    res.json({ feedback: rows });
  } catch (err) { next(err); }
}

async function updateFeedback(req, res, next) {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });
    const [rows] = await pool.query('SELECT user_id FROM platform_feedback WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Feedback not found.' });
    await pool.query('UPDATE platform_feedback SET status = ? WHERE id = ?', [status, req.params.id]);
    if (status === 'approved') {
      await createNotification(rows[0].user_id, 'Your feedback is now public', 'Thanks again — your feedback now appears on the PlumbPro homepage.');
    }
    res.json({ message: 'Feedback updated.' });
  } catch (err) { next(err); }
}

// Public — only ever returns approved entries, and never anything beyond
// what's needed to display a testimonial (no email, no user id).
async function publicFeedback(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT pf.rating, pf.comment, pf.role, u.name AS user_name, pf.created_at
       FROM platform_feedback pf JOIN users u ON u.id = pf.user_id
       WHERE pf.status = 'approved' ORDER BY pf.created_at DESC LIMIT 24`
    );
    res.json({ feedback: rows });
  } catch (err) { next(err); }
}

module.exports = { submitFeedback, myFeedback, listFeedback, updateFeedback, publicFeedback };
