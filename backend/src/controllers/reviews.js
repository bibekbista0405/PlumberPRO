const { pool } = require('../config/db');
const { createNotification } = require('./notifications');

async function createReview(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { booking_id, rating, comment = '' } = req.body;
    if (!booking_id || !rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Booking and rating from 1 to 5 are required.' });
    const [bookings] = await connection.query("SELECT * FROM bookings WHERE id = ? AND customer_id = ? AND status = 'completed'", [booking_id, req.user.id]);
    if (!bookings.length) return res.status(400).json({ message: 'Only your completed bookings can be reviewed.' });
    const booking = bookings[0];
    if (!booking.plumber_id) return res.status(400).json({ message: 'This booking has no assigned plumber.' });
    const [existing] = await connection.query('SELECT id FROM reviews WHERE booking_id = ?', [booking_id]);
    if (existing.length) return res.status(409).json({ message: 'This booking has already been reviewed.' });
    await connection.beginTransaction();
    await connection.query('INSERT INTO reviews (booking_id, customer_id, plumber_id, rating, comment) VALUES (?, ?, ?, ?, ?)', [booking_id, req.user.id, booking.plumber_id, rating, comment.trim()]);
    await connection.query("UPDATE bookings SET status = 'reviewed' WHERE id = ?", [booking_id]);
    await connection.query('INSERT INTO booking_status_history (booking_id, status, changed_by, note) VALUES (?, ?, ?, ?)', [booking_id, 'reviewed', req.user.id, 'Customer submitted a review.']);
    await connection.commit();
    await createNotification(booking.plumber_id, 'New review received', `A customer left you a ${rating}-star review.`);
    res.status(201).json({ message: 'Review submitted.' });
  } catch (err) { try { await connection.rollback(); } catch {} next(err); } finally { connection.release(); }
}

async function listReviews(req, res, next) {
  try {
    const [rows] = await pool.query(`SELECT r.*, c.name AS customer_name, p.name AS plumber_name FROM reviews r JOIN users c ON c.id = r.customer_id LEFT JOIN users p ON p.id = r.plumber_id ORDER BY r.created_at DESC`);
    res.json({ reviews: rows });
  } catch (err) { next(err); }
}

module.exports = { createReview, listReviews };
