const { pool } = require('../config/db');
const { createNotification } = require('./notifications');
const { sendPush } = require('../utils/push');
const { sendEmail, wrap } = require('../utils/email');
const { trackEvent } = require('../utils/analytics');
const { bookingUrlPrefix } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const bookingSelect = `
SELECT b.*, s.name AS service_name, s.icon AS service_icon,
       c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
       p.name AS plumber_name, p.phone AS plumber_phone, r.id AS review_id, r.rating AS review_rating
FROM bookings b
JOIN services s ON s.id = b.service_id
JOIN users c ON c.id = b.customer_id
LEFT JOIN users p ON p.id = b.plumber_id
LEFT JOIN reviews r ON r.booking_id = b.id
`;

// Backend-enforced booking lifecycle (PRD section 13).
// Every key is a "from" status; the array lists statuses it may move to.
const TRANSITIONS = {
  pending: ['assigned', 'confirmed', 'cancelled', 'expired'],
  assigned: ['confirmed', 'rejected', 'cancelled', 'expired'],
  confirmed: ['on_the_way', 'cancelled', 'rejected'],
  on_the_way: ['arrived', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: ['reviewed'],
  reviewed: [],
  cancelled: [],
  rejected: [],
  expired: [],
};

function canTransition(from, to) {
  return Array.isArray(TRANSITIONS[from]) && TRANSITIONS[from].includes(to);
}

async function logHistory(connection, bookingId, status, changedBy, note = null) {
  await connection.query(
    'INSERT INTO booking_status_history (booking_id, status, changed_by, note) VALUES (?, ?, ?, ?)',
    [bookingId, status, changedBy || null, note]
  );
}

async function createBooking(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { service_id, plumber_id = null, address, booking_date, booking_time, description = '' } = req.body;
    if (!service_id || !address || !booking_date || !booking_time) return res.status(400).json({ message: 'Service, address, date and time are required.' });
    const [services] = await connection.query('SELECT id FROM services WHERE id = ? AND status = ? LIMIT 1', [service_id, 'active']);
    if (!services.length) return res.status(400).json({ message: 'Selected service is unavailable.' });

    if (plumber_id) {
      const [plumbers] = await connection.query(`SELECT u.id FROM users u JOIN plumber_profiles pp ON pp.user_id=u.id
        WHERE u.id=? AND u.role='plumber' AND u.status='active' AND pp.available=1`, [plumber_id]);
      if (!plumbers.length) return res.status(400).json({ message: 'Selected plumber is unavailable right now.' });
    }

    const initialStatus = plumber_id ? 'assigned' : 'pending';
    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO bookings (customer_id, plumber_id, service_id, address, booking_date, booking_time, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, plumber_id || null, service_id, address.trim(), booking_date, booking_time, description.trim(), initialStatus]
    );
    await logHistory(connection, result.insertId, initialStatus, req.user.id, plumber_id ? 'Booking requested with a chosen plumber.' : 'Booking requested; awaiting assignment.');
    await connection.commit();
    trackEvent('booking_created', req.user.id, { booking_id: result.insertId, has_chosen_plumber: Boolean(plumber_id), service_id });
    if (plumber_id) {
      await createNotification(plumber_id, 'New booking request', `A customer requested a booking for ${booking_date} at ${booking_time}. Review it from your dashboard.`);
      await sendPush(pool, plumber_id, { title: 'New booking request', body: `Requested for ${booking_date} at ${booking_time}`, url: '/plumber-dashboard' });
    }
    const [rows] = await pool.query(bookingSelect + ' WHERE b.id = ?', [result.insertId]);
    res.status(201).json({ booking: rows[0] });
  } catch (err) { try { await connection.rollback(); } catch {} next(err); } finally { connection.release(); }
}

async function myBookings(req, res, next) {
  try { const [rows] = await pool.query(bookingSelect + ' WHERE b.customer_id = ? ORDER BY b.created_at DESC', [req.user.id]); res.json({ bookings: rows }); } catch (err) { next(err); }
}

async function getBooking(req, res, next) {
  try {
    const [rows] = await pool.query(bookingSelect + ' WHERE b.id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });
    const booking = rows[0];
    if (req.user.role === 'customer' && booking.customer_id !== req.user.id) return res.status(403).json({ message: 'Access denied.' });
    if (req.user.role === 'plumber' && booking.plumber_id !== req.user.id) return res.status(403).json({ message: 'Access denied.' });
    const [history] = await pool.query('SELECT status, changed_by, note, created_at FROM booking_status_history WHERE booking_id = ? ORDER BY created_at ASC', [req.params.id]);
    res.json({ booking, history });
  } catch (err) { next(err); }
}

async function cancelBooking(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM bookings WHERE id = ? AND customer_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });
    if (!canTransition(rows[0].status, 'cancelled')) return res.status(400).json({ message: 'This booking can no longer be cancelled.' });
    await connection.beginTransaction();
    await connection.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
    await logHistory(connection, req.params.id, 'cancelled', req.user.id, 'Cancelled by customer.');
    await connection.commit();
    if (rows[0].plumber_id) {
      await createNotification(rows[0].plumber_id, 'Booking cancelled', `The customer cancelled booking #${req.params.id}.`);
      await sendPush(pool, rows[0].plumber_id, { title: 'Booking cancelled', body: `Booking #${req.params.id} was cancelled by the customer.`, url: '/plumber-dashboard' });
    }
    res.json({ message: 'Booking cancelled.' });
  } catch (err) { try { await connection.rollback(); } catch {} next(err); } finally { connection.release(); }
}

async function adminBookings(req, res, next) {
  try { const [rows] = await pool.query(bookingSelect + ' ORDER BY b.created_at DESC LIMIT 500'); res.json({ bookings: rows }); } catch (err) { next(err); }
}

// Admin may set any valid next status and may (re)assign an alternative plumber —
// this is the "admin intervention" path in PRD section 16. It intentionally does not
// silently replace a booking's plumber unless an explicit plumber_id is sent.
async function updateBooking(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { status, plumber_id = null, note = null } = req.body;
    const known = Object.keys(TRANSITIONS);
    if (!known.includes(status)) return res.status(400).json({ message: 'Invalid booking status.' });
    const [rows] = await connection.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });
    const current = rows[0];
    const isReassignment = plumber_id && Number(plumber_id) !== current.plumber_id;
    const terminal = ['completed', 'reviewed', 'cancelled', 'rejected', 'expired'];
    const adminOverride = !terminal.includes(current.status) && (status === 'cancelled' || status === 'assigned' || isReassignment);
    if (status !== current.status && !canTransition(current.status, status) && !adminOverride) {
      return res.status(400).json({ message: `Cannot move a booking from "${current.status}" to "${status}".` });
    }
    if (plumber_id) {
      const [plumbers] = await connection.query('SELECT id FROM users WHERE id = ? AND role = ? AND status = ?', [plumber_id, 'plumber', 'active']);
      if (!plumbers.length) return res.status(400).json({ message: 'Selected plumber is invalid.' });
    }
    await connection.beginTransaction();
    await connection.query('UPDATE bookings SET status = ?, plumber_id = COALESCE(?, plumber_id) WHERE id = ?', [status, plumber_id, req.params.id]);
    await logHistory(connection, req.params.id, status, req.user.id, isReassignment ? (note || 'Reassigned by the platform.') : note);
    await connection.commit();
    if (isReassignment) {
      await createNotification(Number(plumber_id), 'You were assigned a booking', `You were assigned booking #${req.params.id}. Review it from your dashboard.`);
      await sendPush(pool, Number(plumber_id), { title: 'You were assigned a booking', body: `Booking #${req.params.id} needs your attention.`, url: '/plumber-dashboard' });
    }
    await createNotification(current.customer_id, 'Booking updated', `Booking #${req.params.id} was updated to "${status.replace('_', ' ')}".`);
    const [updated] = await pool.query(bookingSelect + ' WHERE b.id = ?', [req.params.id]);
    res.json({ booking: updated[0] });
  } catch (err) { try { await connection.rollback(); } catch {} next(err); } finally { connection.release(); }
}

async function plumberBookings(req, res, next) {
  try { const [rows] = await pool.query(bookingSelect + ' WHERE b.plumber_id = ? ORDER BY b.booking_date ASC, b.booking_time ASC', [req.user.id]); res.json({ bookings: rows }); } catch (err) { next(err); }
}

const ACTIVE_STATUSES = ['confirmed', 'on_the_way', 'arrived', 'in_progress'];

async function plumberUpdateBooking(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { status } = req.body;
    const allowed = ['confirmed', 'on_the_way', 'arrived', 'in_progress', 'completed', 'rejected', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid plumber status.' });
    const [rows] = await connection.query('SELECT * FROM bookings WHERE id = ? AND plumber_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Assigned booking not found.' });
    const current = rows[0];
    if (!canTransition(current.status, status)) return res.status(400).json({ message: `Cannot move this job from "${current.status}" to "${status}".` });

    if (status === 'confirmed') {
      const [profile] = await connection.query('SELECT available FROM plumber_profiles WHERE user_id = ?', [req.user.id]);
      if (!profile.length || !profile[0].available) return res.status(409).json({ message: 'Turn on availability before accepting new jobs.' });
      const [conflicts] = await connection.query(
        `SELECT id FROM bookings WHERE plumber_id = ? AND id <> ? AND booking_date = ? AND booking_time = ? AND status IN (${ACTIVE_STATUSES.map(() => '?').join(',')})`,
        [req.user.id, req.params.id, current.booking_date, current.booking_time, ...ACTIVE_STATUSES]
      );
      if (conflicts.length) return res.status(409).json({ message: 'You already have another job scheduled at this date and time.' });
    }

    await connection.beginTransaction();
    await connection.query('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    await logHistory(connection, req.params.id, status, req.user.id);
    await connection.commit();

    if (status === 'completed') trackEvent('booking_completed', req.user.id, { booking_id: Number(req.params.id) });

    const statusMessages = {
      confirmed: 'Your plumber accepted the booking.',
      on_the_way: 'Your plumber is on the way.',
      arrived: 'Your plumber has arrived.',
      in_progress: 'Your service has started.',
      completed: 'Your service is complete. You can leave a review.',
      rejected: 'The selected plumber was unable to take this booking.',
      cancelled: 'Your plumber cancelled this booking.',
    };
    if (statusMessages[status]) {
      await createNotification(current.customer_id, 'Booking update', statusMessages[status]);
      await sendPush(pool, current.customer_id, { title: 'Booking update', body: statusMessages[status], url: '/customer-dashboard' });
    }

    // Email at the two moments a customer is most likely to be away from the app.
    if (status === 'confirmed' || status === 'completed') {
      const [[customer]] = await pool.query('SELECT name, email FROM users WHERE id = ?', [current.customer_id]);
      if (customer?.email) {
        const subject = status === 'confirmed' ? 'Your PlumbPro booking was accepted' : 'Your PlumbPro service is complete';
        const body = status === 'confirmed'
          ? `<p>Hi ${customer.name},</p><p>Your plumber accepted booking #${req.params.id}. You can track progress any time from your dashboard.</p>`
          : `<p>Hi ${customer.name},</p><p>Your service for booking #${req.params.id} is marked complete. A quick review helps other customers choose well — it only takes a minute.</p>`;
        sendEmail({ to: customer.email, subject, html: wrap(subject, body) }).catch(() => {});
      }
    }

    const [updated] = await pool.query(bookingSelect + ' WHERE b.id = ?', [req.params.id]);
    res.json({ booking: updated[0] });
  } catch (err) { try { await connection.rollback(); } catch {} next(err); } finally { connection.release(); }
}

// Customer attaches a photo of the problem — before or shortly after booking,
// while it's still pending/assigned/confirmed (not once work has started).
async function uploadBookingPhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image was uploaded.' });
    const [rows] = await pool.query('SELECT id, customer_id, photo_url, status FROM bookings WHERE id = ? AND customer_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });
    if (!['pending', 'assigned', 'confirmed'].includes(rows[0].status)) return res.status(400).json({ message: 'Photos can only be added before work starts.' });

    const url = `${bookingUrlPrefix}/${req.file.filename}`;
    await pool.query('UPDATE bookings SET photo_url = ? WHERE id = ?', [url, req.params.id]);
    if (rows[0].photo_url) {
      const previousPath = path.join(__dirname, '../../uploads/bookings', path.basename(rows[0].photo_url));
      fs.unlink(previousPath, () => {});
    }
    res.json({ photo_url: url });
  } catch (err) { next(err); }
}

// Plumber attaches completion evidence when the job is done — a real trust
// signal beyond a status flag, and useful if a dispute ever comes up.
async function uploadCompletionPhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image was uploaded.' });
    const [rows] = await pool.query('SELECT id, plumber_id, completion_photo_url, status FROM bookings WHERE id = ? AND plumber_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });
    if (!['in_progress', 'completed'].includes(rows[0].status)) return res.status(400).json({ message: 'Completion photos can be added once the job is in progress or done.' });

    const url = `${bookingUrlPrefix}/${req.file.filename}`;
    await pool.query('UPDATE bookings SET completion_photo_url = ? WHERE id = ?', [url, req.params.id]);
    if (rows[0].completion_photo_url) {
      const previousPath = path.join(__dirname, '../../uploads/bookings', path.basename(rows[0].completion_photo_url));
      fs.unlink(previousPath, () => {});
    }
    res.json({ completion_photo_url: url });
  } catch (err) { next(err); }
}

module.exports = { createBooking, myBookings, getBooking, cancelBooking, adminBookings, updateBooking, plumberBookings, plumberUpdateBooking, uploadBookingPhoto, uploadCompletionPhoto, TRANSITIONS };
