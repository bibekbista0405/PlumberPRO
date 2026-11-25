const mysql = require('mysql2/promise');
require('dotenv').config();

// connectionLimit is configurable because the right number depends on your
// deployment: a single small VM might only handle 10-20 well, while a beefier
// box or managed MySQL instance (with headroom for max_connections) can take
// more. This alone doesn't make the app handle "millions of users" — see
// SCALING.md for what actually would.
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'plumber_portal',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  timezone: 'Z',
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

async function testConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
}

module.exports = { pool, testConnection };
