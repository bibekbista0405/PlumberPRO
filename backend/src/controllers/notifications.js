const { pool } = require('../config/db');

async function createNotification(userId, title, message) {
  if (!userId) return;
  try {
    await pool.query('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [userId, title, message]);
  } catch {
    // Notifications are a courtesy feature; never let a failure here break the primary action.
  }
}

async function myNotifications(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT id, title, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    const [[unread]] = await pool.query('SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ notifications: rows, unread: unread.total });
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Notification marked as read.' });
  } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
}

module.exports = { createNotification, myNotifications, markRead, markAllRead };
