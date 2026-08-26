const { pool } = require('../config/db');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function createMessage(req, res, next) {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) return res.status(400).json({ message: 'All contact fields are required.' });
    if (!emailPattern.test(String(email).trim())) return res.status(400).json({ message: 'Please provide a valid email address.' });
    if (String(name).trim().length > 120) return res.status(400).json({ message: 'Name is too long.' });
    if (String(subject).trim().length > 200) return res.status(400).json({ message: 'Subject is too long.' });
    if (String(message).trim().length > 4000) return res.status(400).json({ message: 'Message is too long.' });
    await pool.query('INSERT INTO contact_messages (name, email, subject, message, status) VALUES (?, ?, ?, ?, ?)', [name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim(), 'new']);
    res.status(201).json({ message: 'Your message has been received.' });
  } catch (err) { next(err); }
}

async function listMessages(req, res, next) {
  try { const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC'); res.json({ messages: rows }); } catch (err) { next(err); }
}

async function updateMessage(req, res, next) {
  try { const { status } = req.body; if (!['new','read','replied'].includes(status)) return res.status(400).json({ message: 'Invalid status.' }); await pool.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, req.params.id]); res.json({ message: 'Message updated.' }); } catch (err) { next(err); }
}

module.exports = { createMessage, listMessages, updateMessage };
