const { pool } = require('../config/db');
const { sanitizeFields } = require('../utils/sanitize');
const { createNotification } = require('./notifications');

const REASONS = ['scam_or_fraud', 'unprofessional_behavior', 'no_show', 'overcharged', 'safety_concern', 'other'];

async function createReport(req, res, next) {
  try {
    const clean = sanitizeFields(req.body, ['description']);
    const { plumber_id, booking_id = null, reason, description = '' } = clean;

    if (!plumber_id || !REASONS.includes(reason)) {
      return res.status(400).json({ message: 'A plumber and a valid reason are required.' });
    }
    if (String(description).length > 2000) {
      return res.status(400).json({ message: 'Description is too long.' });
    }

    const [plumbers] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'plumber'", [plumber_id]);
    if (!plumbers.length) return res.status(404).json({ message: 'Plumber not found.' });

    if (booking_id) {
      const [bookings] = await pool.query('SELECT id FROM bookings WHERE id = ? AND customer_id = ? AND plumber_id = ?', [booking_id, req.user.id, plumber_id]);
      if (!bookings.length) return res.status(400).json({ message: "That booking doesn't match your account and this plumber." });
    }

    const [result] = await pool.query(
      'INSERT INTO plumber_reports (reporter_id, plumber_id, booking_id, reason, description) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, plumber_id, booking_id || null, reason, description.trim()]
    );

    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin' AND status = 'active'");
    await Promise.all(admins.map(a => createNotification(a.id, 'New plumber report', 'A customer submitted a report through the support panel. Please review it.')));

    res.status(201).json({ message: 'Thanks — your report has been sent to our support team.', id: result.insertId });
  } catch (err) {
    next(err);
  }
}

async function listReports(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT pr.*, reporter.name AS reporter_name, reporter.email AS reporter_email,
             plumber.name AS plumber_name, plumber.email AS plumber_email
      FROM plumber_reports pr
      JOIN users reporter ON reporter.id = pr.reporter_id
      JOIN users plumber ON plumber.id = pr.plumber_id
      ORDER BY pr.created_at DESC
      LIMIT 500
    `);
    res.json({ reports: rows });
  } catch (err) {
    next(err);
  }
}

async function updateReport(req, res, next) {
  try {
    const clean = sanitizeFields(req.body, ['resolution_note']);
    const { status, resolution_note = null } = clean;
    if (!['new', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const [rows] = await pool.query('SELECT reporter_id FROM plumber_reports WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Report not found.' });

    await pool.query('UPDATE plumber_reports SET status = ?, resolution_note = COALESCE(?, resolution_note) WHERE id = ?', [status, resolution_note, req.params.id]);

    // Close the loop with the person who reported it, instead of a silent status change.
    if (status === 'resolved' || status === 'dismissed') {
      const summary = status === 'resolved'
        ? "We've looked into your report and taken appropriate action."
        : "We've reviewed your report and didn't find grounds for action, based on what we found.";
      await createNotification(rows[0].reporter_id, 'Update on your report', resolution_note ? `${summary} Note: ${resolution_note}` : summary);
    }

    res.json({ message: 'Report updated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReport, listReports, updateReport, REASONS };
