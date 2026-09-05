const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const { createNotification } = require('./notifications');

async function stats(req, res, next) {
  try {
    const [[users]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'customer'");
    const [[plumbers]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'plumber'");
    const [[verified]] = await pool.query("SELECT COUNT(*) AS total FROM users u JOIN plumber_profiles pp ON pp.user_id=u.id WHERE u.role='plumber' AND pp.verified=1");
    const [[bookings]] = await pool.query('SELECT COUNT(*) AS total FROM bookings');
    const [[pending]] = await pool.query("SELECT COUNT(*) AS total FROM bookings WHERE status IN ('pending','assigned')");
    const [[active]] = await pool.query("SELECT COUNT(*) AS total FROM bookings WHERE status IN ('confirmed','on_the_way','arrived','in_progress')");
    const [[completed]] = await pool.query("SELECT COUNT(*) AS total FROM bookings WHERE status IN ('completed','reviewed')");
    const [[services]] = await pool.query("SELECT COUNT(*) AS total FROM services WHERE status = 'active'");
    const [[messages]] = await pool.query("SELECT COUNT(*) AS total FROM contact_messages WHERE status = 'new'");
    res.json({ stats: { customers: users.total, plumbers: plumbers.total, verified_plumbers: verified.total, bookings: bookings.total, pending: pending.total, active: active.total, completed: completed.total, services: services.total, new_messages: messages.total } });
  } catch (err) { next(err); }
}

async function users(req, res, next) {
  try { const [rows] = await pool.query('SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 500'); res.json({ users: rows }); } catch (err) { next(err); }
}

async function plumbers(req, res, next) {
  try {
    const [rows] = await pool.query(`SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
      pp.profession, pp.education, pp.experience_years, pp.work_mode, pp.available, pp.location_name,
      pp.latitude, pp.longitude, pp.service_radius_km, pp.can_travel, pp.bio, pp.verified, pp.verified_at,
      COALESCE(ROUND(AVG(r.rating),1),0) rating, COUNT(r.id) review_count
      FROM users u LEFT JOIN plumber_profiles pp ON pp.user_id=u.id LEFT JOIN reviews r ON r.plumber_id=u.id
      WHERE u.role='plumber' GROUP BY u.id, pp.id ORDER BY u.created_at DESC LIMIT 500`);
    res.json({ plumbers: rows });
  } catch (err) { next(err); }
}

async function createPlumber(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { name, email, phone = '', password, profession = 'Plumbing Professional', education = '', experience_years = 0, work_mode = 'solo', available = true, location_name = '', latitude = null, longitude = null, service_radius_km = 15, can_travel = true, bio = '' } = req.body;
    if (!name || !email || !password || password.length < 6 || !profession || !location_name) return res.status(400).json({ message: 'Name, email, password, profession and location are required.' });
    const normalized = email.trim().toLowerCase();
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [normalized]);
    if (existing.length) return res.status(409).json({ message: 'An account with this email already exists.' });
    const hash = await bcrypt.hash(password, 12);
    await connection.beginTransaction();
    const [result] = await connection.query('INSERT INTO users (name,email,phone,password_hash,role,status) VALUES (?,?,?,?,?,?)', [name.trim(), normalized, phone.trim(), hash, 'plumber', 'active']);
    await connection.query(`INSERT INTO plumber_profiles (user_id,profession,education,experience_years,work_mode,available,location_name,latitude,longitude,service_radius_km,can_travel,bio,verified) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`, [result.insertId, profession.trim(), education.trim(), Math.max(0, Number(experience_years)||0), work_mode, Boolean(available), location_name.trim(), latitude || null, longitude || null, Math.min(Math.max(Number(service_radius_km)||15,1),100), Boolean(can_travel), bio.trim()]);
    await connection.commit();
    res.status(201).json({ message: 'Plumber account created.', plumber: { id: result.insertId, name: name.trim(), email: normalized, phone: phone.trim(), role: 'plumber', status: 'active', verified: false } });
  } catch (err) { try { await connection.rollback(); } catch {} next(err); } finally { connection.release(); }
}

async function setUserStatus(req, res, next) {
  try { const { status } = req.body; if (!['active','suspended'].includes(status)) return res.status(400).json({ message: 'Invalid status.' }); await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]); res.json({ message: 'User status updated.' }); } catch (err) { next(err); }
}

async function verifyPlumber(req, res, next) {
  try {
    const { verified } = req.body;
    const [result] = await pool.query('UPDATE plumber_profiles SET verified = ?, verified_at = ? WHERE user_id = ? AND EXISTS (SELECT 1 FROM users WHERE id = ? AND role = \'plumber\')', [Boolean(verified), verified ? new Date() : null, req.params.id, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Plumber profile not found.' });
    await createNotification(Number(req.params.id), verified ? 'Profile verified' : 'Verification removed', verified ? 'Your plumber profile is now verified and visible in public search.' : 'Your plumber profile is no longer verified. Contact support if you have questions.');
    res.json({ message: verified ? 'Plumber verified.' : 'Plumber verification removed.' });
  } catch (err) { next(err); }
}

// Self-hosted funnel: search -> booking -> completion, over the last N days.
// No third-party analytics service, no cost, and nothing more sensitive than
// counts of events already implied by using the product.
async function analytics(req, res, next) {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const [[searches]] = await pool.query("SELECT COUNT(*) AS total FROM analytics_events WHERE event_name = 'plumber_search' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)", [days]);
    const [[bookingsCreated]] = await pool.query("SELECT COUNT(*) AS total FROM analytics_events WHERE event_name = 'booking_created' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)", [days]);
    const [[bookingsCompleted]] = await pool.query("SELECT COUNT(*) AS total FROM analytics_events WHERE event_name = 'booking_completed' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)", [days]);
    const [[registrations]] = await pool.query("SELECT COUNT(*) AS total FROM analytics_events WHERE event_name = 'user_registered' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)", [days]);
    const [[reviews]] = await pool.query("SELECT COUNT(*) AS total FROM analytics_events WHERE event_name = 'review_submitted' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)", [days]);
    const [daily] = await pool.query(
      `SELECT DATE(created_at) AS day, event_name, COUNT(*) AS total FROM analytics_events
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND event_name IN ('plumber_search','booking_created','booking_completed')
       GROUP BY DATE(created_at), event_name ORDER BY day ASC`,
      [days]
    );
    res.json({
      range_days: days,
      totals: {
        searches: searches.total,
        bookings_created: bookingsCreated.total,
        bookings_completed: bookingsCompleted.total,
        registrations: registrations.total,
        reviews: reviews.total,
      },
      conversion: {
        search_to_booking: searches.total ? Number(((bookingsCreated.total / searches.total) * 100).toFixed(1)) : null,
        booking_to_completed: bookingsCreated.total ? Number(((bookingsCompleted.total / bookingsCreated.total) * 100).toFixed(1)) : null,
      },
      daily,
    });
  } catch (err) { next(err); }
}

module.exports = { stats, users, plumbers, createPlumber, setUserStatus, verifyPlumber, analytics };
