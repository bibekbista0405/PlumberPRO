const { pool } = require('../config/db');

async function listServices(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM services WHERE status = ? ORDER BY name', ['active']);
    res.json({ services: rows });
  } catch (err) { next(err); }
}

async function listAllServices(req, res, next) {
  try { const [rows] = await pool.query('SELECT * FROM services ORDER BY created_at DESC'); res.json({ services: rows }); } catch (err) { next(err); }
}

async function createService(req, res, next) {
  try {
    const { name, description = '', price = 0, icon = '🔧' } = req.body;
    if (!name) return res.status(400).json({ message: 'Service name is required.' });
    const [result] = await pool.query('INSERT INTO services (name, description, price, icon, status) VALUES (?, ?, ?, ?, ?)', [name.trim(), description.trim(), Number(price) || 0, icon, 'active']);
    const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [result.insertId]);
    res.status(201).json({ service: rows[0] });
  } catch (err) { next(err); }
}

async function updateService(req, res, next) {
  try {
    const { name, description = '', price = 0, icon = '🔧', status = 'active' } = req.body;
    await pool.query('UPDATE services SET name = ?, description = ?, price = ?, icon = ?, status = ? WHERE id = ?', [name, description, Number(price) || 0, icon, status, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Service not found.' });
    res.json({ service: rows[0] });
  } catch (err) { next(err); }
}

async function deleteService(req, res, next) {
  try { await pool.query('UPDATE services SET status = ? WHERE id = ?', ['inactive', req.params.id]); res.json({ message: 'Service disabled.' }); } catch (err) { next(err); }
}

module.exports = { listServices, listAllServices, createService, updateService, deleteService };
