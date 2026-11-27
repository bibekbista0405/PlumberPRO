const { pool } = require('../config/db');

// Site-wide switches the admin can flip without a redeploy. Each entry is
// { default, type }. Stored as text in site_settings so new switches need no
// schema change.
const DEFINITIONS = {
  show_service_prices: { default: false, type: 'boolean' },
};

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  // Safe to run repeatedly; means a fresh deploy works even before the
  // v8 migration has been applied by hand.
  await pool.query(`CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  tableReady = true;
}

function parse(def, raw) {
  if (raw === undefined || raw === null) return def.default;
  if (def.type === 'boolean') return raw === 'true' || raw === '1';
  return raw;
}

async function readSettings() {
  const result = {};
  let rows = [];
  try {
    await ensureTable();
    [rows] = await pool.query('SELECT setting_key, setting_value FROM site_settings');
  } catch (err) {
    // Settings must never take the public site down; fall back to defaults.
    console.error('Unable to read site settings, using defaults:', err.message);
  }
  const stored = Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value]));
  Object.entries(DEFINITIONS).forEach(([key, def]) => { result[key] = parse(def, stored[key]); });
  return result;
}

async function getPublicSettings(req, res, next) {
  try {
    res.set('Cache-Control', 'no-store');
    res.json({ settings: await readSettings() });
  } catch (err) { next(err); }
}

async function updateSettings(req, res, next) {
  try {
    const incoming = req.body || {};
    const updates = Object.keys(incoming).filter(k => DEFINITIONS[k]);
    if (!updates.length) return res.status(400).json({ message: 'No valid settings supplied.' });
    for (const key of updates) {
      if (DEFINITIONS[key].type === 'boolean' && typeof incoming[key] !== 'boolean') {
        return res.status(400).json({ message: `${key} must be true or false.` });
      }
    }
    await ensureTable();
    for (const key of updates) {
      await pool.query(
        `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
        [key, String(incoming[key])]
      );
    }
    res.json({ settings: await readSettings() });
  } catch (err) { next(err); }
}

module.exports = { getPublicSettings, updateSettings, readSettings };
