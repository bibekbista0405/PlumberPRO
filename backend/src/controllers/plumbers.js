const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { sanitizeFields } = require('../utils/sanitize');
const { uploadDir } = require('../middleware/upload');
const { trackEvent } = require('../utils/analytics');

const profileFields = `
  u.id, u.name, u.email, u.phone, u.status, u.created_at,
  pp.profession, pp.education, pp.certifications, pp.experience_years, pp.work_mode,
  pp.available, pp.location_name, pp.latitude, pp.longitude,
  pp.service_radius_km, pp.can_travel, pp.bio, pp.photo_url, pp.verified, pp.verified_at
`;

const ratingJoin = `
  LEFT JOIN (
    SELECT plumber_id,
           ROUND(AVG(rating), 1) AS rating,
           COUNT(*) AS review_count
    FROM reviews
    GROUP BY plumber_id
  ) r ON r.plumber_id = u.id
`;

async function searchPlumbers(req, res, next) {
  try {
    const q = String(req.query.q || '').trim();
    const latValue = Number(req.query.lat);
    const lngValue = Number(req.query.lng);
    const hasCoords = Number.isFinite(latValue) && Number.isFinite(lngValue);
    const radius = Math.min(Math.max(Number(req.query.radius) || 25, 1), 100);
    const params = [];

    let where = `
      WHERE u.role = 'plumber'
        AND u.status = 'active'
        AND pp.available = 1
    `;

    if (q) {
      where += ` AND (pp.location_name LIKE ? OR pp.profession LIKE ? OR u.name LIKE ?)`;
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    const service = String(req.query.service || '').trim();
    if (service) {
      where += ` AND (pp.profession LIKE ? OR pp.bio LIKE ?)`;
      const term = `%${service}%`;
      params.push(term, term);
    }

    let distanceSelect = `NULL AS distance_km`;
    let having = '';

    if (hasCoords) {
      // Clamp ACOS input to [-1, 1] to avoid floating point domain errors.
      distanceSelect = `6371 * ACOS(LEAST(1, GREATEST(-1,
        COS(RADIANS(?)) * COS(RADIANS(pp.latitude)) * COS(RADIANS(pp.longitude) - RADIANS(?)) +
        SIN(RADIANS(?)) * SIN(RADIANS(pp.latitude))
      ))) AS distance_km`;
      params.unshift(latValue, lngValue, latValue);
      having = ` HAVING distance_km <= ? AND (
        pp.service_radius_km IS NULL OR distance_km <= pp.service_radius_km OR pp.can_travel = 1
      )`;
      params.push(radius);
    }

    const sql = `
      SELECT
        ${profileFields},
        COALESCE(r.rating, 0) AS rating,
        COALESCE(r.review_count, 0) AS review_count,
        ${distanceSelect}
      FROM users u
      LEFT JOIN plumber_profiles pp ON pp.user_id = u.id
      ${ratingJoin}
      ${where}
      ${having}
      ORDER BY ${hasCoords ? 'distance_km ASC, ' : ''}pp.verified DESC, rating DESC, review_count DESC, u.name ASC
      LIMIT 30
    `;

    const [rows] = await pool.query(sql, params);
    trackEvent('plumber_search', req.user?.id || null, { has_location: hasCoords, has_service_filter: Boolean(service), result_count: rows.length });
    res.json({ plumbers: rows });
  } catch (err) {
    next(err);
  }
}

// Public plumber profile — shown when a customer clicks through from search
// results. Deliberately omits email/phone (only shared once a booking exists)
// and includes real, recent reviews rather than just the aggregate rating.
async function getPublicProfile(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id, u.name, u.created_at,
        pp.profession, pp.education, pp.certifications, pp.experience_years, pp.work_mode,
        pp.available, pp.location_name, pp.service_radius_km, pp.can_travel, pp.bio, pp.photo_url,
        pp.verified, pp.verified_at,
        COALESCE(r.rating, 0) AS rating,
        COALESCE(r.review_count, 0) AS review_count
      FROM users u
      LEFT JOIN plumber_profiles pp ON pp.user_id = u.id
      ${ratingJoin}
      WHERE u.id = ? AND u.role = 'plumber' AND u.status = 'active'
      LIMIT 1
    `, [req.params.id]);
    if (!rows.length || !rows[0].profession) return res.status(404).json({ message: 'Plumber not found.' });

    const [reviews] = await pool.query(`
      SELECT rv.rating, rv.comment, rv.created_at, c.name AS customer_name
      FROM reviews rv JOIN users c ON c.id = rv.customer_id
      WHERE rv.plumber_id = ?
      ORDER BY rv.created_at DESC
      LIMIT 20
    `, [req.params.id]);

    const [[completedCount]] = await pool.query(
      "SELECT COUNT(*) AS total FROM bookings WHERE plumber_id = ? AND status IN ('completed','reviewed')",
      [req.params.id]
    );

    res.json({ profile: { ...rows[0], completed_jobs: completedCount.total }, reviews });
  } catch (err) {
    next(err);
  }
}

async function getMyProfile(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        ${profileFields},
        COALESCE(r.rating, 0) AS rating,
        COALESCE(r.review_count, 0) AS review_count
      FROM users u
      LEFT JOIN plumber_profiles pp ON pp.user_id = u.id
      ${ratingJoin}
      WHERE u.id = ?
      LIMIT 1
    `, [req.user.id]);
    res.json({ profile: rows[0] || null });
  } catch (err) {
    next(err);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const clean = sanitizeFields(req.body, ['profession', 'education', 'certifications', 'location_name', 'bio']);
    const {
      profession = '', education = '', certifications = '', experience_years = 0, work_mode = 'solo',
      available = true, location_name = '', latitude = null, longitude = null,
      service_radius_km = 15, can_travel = true, bio = ''
    } = clean;

    if (!profession.trim() || !location_name.trim()) {
      return res.status(400).json({ message: 'Profession and location are required.' });
    }
    if (!['solo', 'team'].includes(work_mode)) {
      return res.status(400).json({ message: 'Invalid work mode.' });
    }
    if (latitude !== null && latitude !== '' && (!Number.isFinite(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90)) {
      return res.status(400).json({ message: 'Invalid latitude.' });
    }
    if (longitude !== null && longitude !== '' && (!Number.isFinite(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)) {
      return res.status(400).json({ message: 'Invalid longitude.' });
    }

    await pool.query(`
      INSERT INTO plumber_profiles
        (user_id, profession, education, certifications, experience_years, work_mode, available, location_name, latitude, longitude, service_radius_km, can_travel, bio, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      ON DUPLICATE KEY UPDATE
        profession=VALUES(profession), education=VALUES(education), certifications=VALUES(certifications), experience_years=VALUES(experience_years),
        work_mode=VALUES(work_mode), available=VALUES(available), location_name=VALUES(location_name),
        latitude=VALUES(latitude), longitude=VALUES(longitude), service_radius_km=VALUES(service_radius_km),
        can_travel=VALUES(can_travel), bio=VALUES(bio), verified=0, verified_at=NULL
    `, [
      req.user.id, profession.trim(), education.trim(), certifications.trim(), Math.max(0, Number(experience_years) || 0), work_mode,
      Boolean(available), location_name.trim(), latitude === null || latitude === '' ? null : Number(latitude),
      longitude === null || longitude === '' ? null : Number(longitude), Math.min(Math.max(Number(service_radius_km) || 15, 1), 100),
      Boolean(can_travel), bio.trim()
    ]);

    const [rows] = await pool.query(`
      SELECT
        ${profileFields},
        COALESCE(r.rating, 0) AS rating,
        COALESCE(r.review_count, 0) AS review_count
      FROM users u
      LEFT JOIN plumber_profiles pp ON pp.user_id = u.id
      ${ratingJoin}
      WHERE u.id = ?
      LIMIT 1
    `, [req.user.id]);

    res.json({ profile: rows[0] || null });
  } catch (err) {
    next(err);
  }
}

async function uploadProfilePhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image was uploaded.' });
    const [existing] = await pool.query('SELECT photo_url FROM plumber_profiles WHERE user_id = ?', [req.user.id]);
    const photoUrl = `/uploads/plumbers/${req.file.filename}`;

    await pool.query(
      `INSERT INTO plumber_profiles (user_id, profession, location_name, photo_url)
       VALUES (?, '', '', ?)
       ON DUPLICATE KEY UPDATE photo_url = VALUES(photo_url)`,
      [req.user.id, photoUrl]
    );

    // Clean up the previous photo file so uploads don't accumulate forever.
    const previous = existing[0]?.photo_url;
    if (previous && previous.startsWith('/uploads/plumbers/')) {
      const previousPath = path.join(uploadDir, path.basename(previous));
      fs.unlink(previousPath, () => {});
    }

    res.json({ photo_url: photoUrl });
  } catch (err) {
    next(err);
  }
}

// Public, non-sensitive counts used for honest trust indicators on the marketing
// site (never fabricated numbers — this is the same principle the rest of the
// app follows: real data or no claim at all).
async function publicStats(req, res, next) {
  try {
    const [[verified]] = await pool.query(
      "SELECT COUNT(*) AS total FROM plumber_profiles WHERE verified = 1"
    );
    const [[completed]] = await pool.query(
      "SELECT COUNT(*) AS total FROM bookings WHERE status IN ('completed','reviewed')"
    );
    const [[areas]] = await pool.query(
      "SELECT COUNT(DISTINCT location_name) AS total FROM plumber_profiles WHERE verified = 1 AND location_name IS NOT NULL AND location_name <> ''"
    );
    const [[ratings]] = await pool.query(
      "SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS total FROM reviews"
    );
    res.json({
      verifiedPlumbers: verified.total,
      completedBookings: completed.total,
      areasCovered: areas.total,
      averageRating: ratings.total > 0 ? Number(ratings.avg_rating) : null,
      totalReviews: ratings.total,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { searchPlumbers, getPublicProfile, getMyProfile, updateMyProfile, uploadProfilePhoto, publicStats };
