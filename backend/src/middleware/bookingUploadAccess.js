const { pool } = require('../config/db');
const { isPositiveInteger } = require('../utils/bookingValidation');

// Run before Multer so unauthorized requests never write a file to disk.
async function authorizeBookingPhotoUpload(req, res, next) {
  try {
    if (!isPositiveInteger(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }
    const [rows] = await pool.query(
      'SELECT id, customer_id, status FROM bookings WHERE id = ? AND customer_id = ?',
      [Number(req.params.id), req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });
    if (!['pending', 'assigned', 'confirmed'].includes(rows[0].status)) {
      return res.status(400).json({ message: 'Photos can only be added before work starts.' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

async function authorizeCompletionPhotoUpload(req, res, next) {
  try {
    if (!isPositiveInteger(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }
    const [rows] = await pool.query(
      'SELECT id, status FROM bookings WHERE id = ? AND plumber_id = ?',
      [Number(req.params.id), req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Assigned booking not found.' });
    if (!['in_progress', 'completed'].includes(rows[0].status)) {
      return res.status(400).json({ message: 'Completion photos can be added once the job is in progress or done.' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authorizeBookingPhotoUpload, authorizeCompletionPhotoUpload };
