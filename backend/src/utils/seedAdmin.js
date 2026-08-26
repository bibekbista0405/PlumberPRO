require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('../config/db');

(async () => {
  try {
    await testConnection();
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || 'PlumbPro Admin';
    if (!email || !password) {
      console.error('Usage: node src/utils/seedAdmin.js admin@example.com StrongPassword "Admin Name"');
      process.exit(1);
    }
    const hash = await bcrypt.hash(password, 12);
    await pool.query(`INSERT INTO users (name,email,password_hash,role,status) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash), role='admin', status='active'`, [name, email.toLowerCase(), hash, 'admin', 'active']);
    console.log(`Admin account ready: ${email}`);
  } catch (err) { console.error(err); process.exitCode = 1; }
  finally { await pool.end(); }
})();
