require('dotenv').config();
const { testConnection, pool } = require('../config/db');

(async () => {
  try {
    const result = await testConnection();
    console.log('Aiven PostgreSQL connection successful.');
    console.log(`Database: ${result.database}`);
    console.log(String(result.version).split('\n')[0]);
  } catch (error) {
    console.error('Aiven PostgreSQL connection failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
