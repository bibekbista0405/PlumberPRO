const { pool } = require('../config/db');
const { sanitizeFields } = require('../utils/sanitize');
const { createNotification } = require('./notifications');
const { sendPush } = require('../utils/push');

// Confirms the requester is actually one of the two participants on this
// booking (never trust the booking_id alone — every read/write re-checks this).
async function getBookingIfParticipant(bookingId, userId) {
  const [rows] = await pool.query(
    'SELECT id, customer_id, plumber_id FROM bookings WHERE id = ? AND (customer_id = ? OR plumber_id = ?)',
    [bookingId, userId, userId]
  );
  return rows[0] || null;
}

async function listMessages(req, res, next) {
  try {
    const booking = await getBookingIfParticipant(req.params.bookingId, req.user.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    const [rows] = await pool.query(
      `SELECT bm.*, u.name AS sender_name FROM booking_messages bm
       JOIN users u ON u.id = bm.sender_id
       WHERE bm.booking_id = ? ORDER BY bm.created_at ASC`,
      [booking.id]
    );
    await pool.query(
      'UPDATE booking_messages SET is_read = 1 WHERE booking_id = ? AND sender_id != ?',
      [booking.id, req.user.id]
    );
    res.json({ messages: rows, participants: { customer_id: booking.customer_id, plumber_id: booking.plumber_id } });
  } catch (err) { next(err); }
}

async function sendMessage(req, res, next) {
  try {
    const booking = await getBookingIfParticipant(req.params.bookingId, req.user.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (!booking.plumber_id) return res.status(400).json({ message: 'This booking has no assigned plumber yet.' });

    const clean = sanitizeFields(req.body, ['message']);
    const text = (clean.message || '').trim();
    if (!text) return res.status(400).json({ message: 'Message cannot be empty.' });
    if (text.length > 1000) return res.status(400).json({ message: 'Message is too long (max 1000 characters).' });

    const [result] = await pool.query(
      'INSERT INTO booking_messages (booking_id, sender_id, message) VALUES (?, ?, ?)',
      [booking.id, req.user.id, text]
    );

    const recipientId = req.user.id === booking.customer_id ? booking.plumber_id : booking.customer_id;
    const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
    await createNotification(recipientId, 'New message', preview);
    await sendPush(pool, recipientId, { title: 'New message on your booking', body: preview, url: '/' });

    const [rows] = await pool.query(
      `SELECT bm.*, u.name AS sender_name FROM booking_messages bm JOIN users u ON u.id = bm.sender_id WHERE bm.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ message: rows[0] });
  } catch (err) { next(err); }
}

// Every booking the user is a participant on (once a plumber is assigned),
// with the most recent message and a per-conversation unread count — powers
// a proper chat-style inbox instead of digging through individual bookings.
async function listConversations(req, res, next) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT
         b.id AS booking_id,
         b.status AS booking_status,
         s.name AS service_name,
         CASE WHEN b.customer_id = ? THEN b.plumber_id ELSE b.customer_id END AS other_user_id,
         CASE WHEN b.customer_id = ? THEN pu.name ELSE cu.name END AS other_user_name,
         lm.message AS last_message,
         lm.created_at AS last_message_at,
         lm.sender_id AS last_sender_id,
         (SELECT COUNT(*) FROM booking_messages bm2
            WHERE bm2.booking_id = b.id AND bm2.is_read = 0 AND bm2.sender_id != ?) AS unread_count
       FROM bookings b
       JOIN users cu ON cu.id = b.customer_id
       LEFT JOIN users pu ON pu.id = b.plumber_id
       LEFT JOIN services s ON s.id = b.service_id
       LEFT JOIN (
         SELECT bm.booking_id, bm.message, bm.created_at, bm.sender_id
         FROM booking_messages bm
         INNER JOIN (SELECT booking_id, MAX(id) AS max_id FROM booking_messages GROUP BY booking_id) latest
           ON latest.booking_id = bm.booking_id AND latest.max_id = bm.id
       ) lm ON lm.booking_id = b.id
       WHERE b.plumber_id IS NOT NULL AND (b.customer_id = ? OR b.plumber_id = ?)
       ORDER BY COALESCE(lm.created_at, b.updated_at, b.created_at) DESC`,
      [userId, userId, userId, userId, userId]
    );
    res.json({ conversations: rows });
  } catch (err) { next(err); }
}

// Total unread across all of the user's bookings — used for a lightweight
// "you have unread messages" indicator without opening every booking.
async function unreadCount(req, res, next) {
  try {
    const [[row]] = await pool.query(
      `SELECT COUNT(*) AS total FROM booking_messages bm
       JOIN bookings b ON b.id = bm.booking_id
       WHERE bm.is_read = 0 AND bm.sender_id != ? AND (b.customer_id = ? OR b.plumber_id = ?)`,
      [req.user.id, req.user.id, req.user.id]
    );
    res.json({ unread: row.total });
  } catch (err) { next(err); }
}

module.exports = { listMessages, sendMessage, unreadCount, listConversations };
