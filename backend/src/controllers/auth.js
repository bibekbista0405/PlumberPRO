const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { signToken, sanitizeUser } = require('../utils/auth');

async function register(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const {
      name, email, phone = '', password, role = 'customer',
      profession = '', education = '', experience_years = 0, work_mode = 'solo',
      available = true, location_name = '', latitude = null, longitude = null,
      service_radius_km = 15, can_travel = true, bio = ''
    } = req.body;

    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    if (!['customer', 'plumber'].includes(role)) return res.status(400).json({ message: 'Invalid registration role.' });

    const normalizedEmail = email.trim().toLowerCase();
    if (role === 'plumber' && (!profession.trim() || !location_name.trim())) {
      return res.status(400).json({ message: 'Profession and service location are required for plumber registration.' });
    }
    if (role === 'plumber' && !['solo', 'team'].includes(work_mode)) return res.status(400).json({ message: 'Invalid work mode.' });

    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length) return res.status(409).json({ message: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO users (name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), normalizedEmail, phone.trim(), passwordHash, role, 'active']
    );

    if (role === 'plumber') {
      await connection.query(`INSERT INTO plumber_profiles
        (user_id, profession, education, experience_years, work_mode, available, location_name, latitude, longitude, service_radius_km, can_travel, bio, verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`, [
        result.insertId, profession.trim(), education.trim(), Math.max(0, Number(experience_years) || 0), work_mode,
        Boolean(available), location_name.trim(), latitude === null || latitude === '' ? null : Number(latitude),
        longitude === null || longitude === '' ? null : Number(longitude), Math.min(Math.max(Number(service_radius_km) || 15, 1), 100),
        Boolean(can_travel), bio.trim()
      ]);
    }

    await connection.commit();
    const [rows] = await pool.query('SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?', [result.insertId]);
    const user = rows[0];
    res.status(201).json({ user: sanitizeUser(user), token: signToken(user), verification_pending: role === 'plumber' });
  } catch (err) {
    try { await connection.rollback(); } catch {}
    next(err);
  } finally { connection.release(); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid email or password.' });
    const user = rows[0];
    if (user.status !== 'active') return res.status(403).json({ message: 'This account is not active.' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });
    res.json({ user: sanitizeUser(user), token: signToken(user) });
  } catch (err) { next(err); }
}

async function me(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: sanitizeUser(rows[0]) });
  } catch (err) { next(err); }
}

module.exports = { register, login, me };
