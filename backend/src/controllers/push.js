const { pool } = require('../config/db');
const { isPushEnabled } = require('../utils/push');

async function status(req, res) {
  res.json({ enabled: isPushEnabled() });
}

async function subscribe(req, res, next) {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) return res.status(400).json({ message: 'Invalid subscription.' });
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), p256dh = VALUES(p256dh), auth = VALUES(auth)`,
      [req.user.id, endpoint, keys.p256dh, keys.auth]
    );
    res.status(201).json({ message: 'Subscribed to push notifications.' });
  } catch (err) { next(err); }
}

async function unsubscribe(req, res, next) {
  try {
    const { endpoint } = req.body;
    if (endpoint) await pool.query('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?', [req.user.id, endpoint]);
    res.json({ message: 'Unsubscribed.' });
  } catch (err) { next(err); }
}

module.exports = { status, subscribe, unsubscribe };
