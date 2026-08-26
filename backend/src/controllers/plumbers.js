const { pool } = require('../config/db');

const profileFields = `
  u.id, u.name, u.email, u.phone, u.status, u.created_at,
  pp.profession, pp.education, pp.experience_years, pp.work_mode,
  pp.available, pp.location_name, pp.latitude, pp.longitude,
  pp.service_radius_km, pp.can_travel, pp.bio, pp.verified, pp.verified_at
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
        AND pp.verified = 1
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
      ORDER BY ${hasCoords ? 'distance_km ASC, ' : ''}rating DESC, u.name ASC
      LIMIT 30
    `;

    const [rows] = await pool.query(sql, params);
    res.json({ plumbers: rows });
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
    const {
      profession = '', education = '', experience_years = 0, work_mode = 'solo',
      available = true, location_name = '', latitude = null, longitude = null,
      service_radius_km = 15, can_travel = true, bio = ''
    } = req.body;

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
        (user_id, profession, education, experience_years, work_mode, available, location_name, latitude, longitude, service_radius_km, can_travel, bio, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      ON DUPLICATE KEY UPDATE
        profession=VALUES(profession), education=VALUES(education), experience_years=VALUES(experience_years),
        work_mode=VALUES(work_mode), available=VALUES(available), location_name=VALUES(location_name),
        latitude=VALUES(latitude), longitude=VALUES(longitude), service_radius_km=VALUES(service_radius_km),
        can_travel=VALUES(can_travel), bio=VALUES(bio), verified=0, verified_at=NULL
    `, [
      req.user.id, profession.trim(), education.trim(), Math.max(0, Number(experience_years) || 0), work_mode,
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

module.exports = { searchPlumbers, getMyProfile, updateMyProfile };
