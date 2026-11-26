const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const backendRoot = path.resolve(__dirname, '../..');
require('dotenv').config({ path: path.join(backendRoot, '.env') });

const sslEnabled = String(process.env.PGSSL ?? 'true').toLowerCase() !== 'false';
const rejectUnauthorized = String(process.env.PGSSL_REJECT_UNAUTHORIZED ?? 'true').toLowerCase() !== 'false';
// Resolve the CA relative to the backend package, not Vercel's process.cwd().
// Default to the Aiven CA shipped with this project so production cannot
// silently fall back to Node's public system trust store when the file is missing.
const caPath = path.resolve(
  backendRoot,
  process.env.PGSSL_CA_FILE || './certs/aiven-ca.pem'
);

let ssl = false;
if (sslEnabled) {
  if (rejectUnauthorized) {
    if (!fs.existsSync(caPath)) {
      throw new Error(
        `PostgreSQL SSL CA certificate was not found at ${caPath}. ` +
        'Ensure backend/certs/aiven-ca.pem is committed and deployed, or set PGSSL_CA_FILE to its path.'
      );
    }
    const ca = fs.readFileSync(caPath, 'utf8');
    if (!ca.includes('-----BEGIN CERTIFICATE-----')) {
      throw new Error(`PostgreSQL SSL CA file is not a valid PEM certificate: ${caPath}`);
    }
    console.info(`PostgreSQL SSL CA certificate loaded from ${caPath}`);
    ssl = { rejectUnauthorized: true, ca };
  } else {
    // Explicit opt-out is retained for local diagnostics only. Production
    // should keep PGSSL_REJECT_UNAUTHORIZED=true and provide the Aiven CA.
    ssl = { rejectUnauthorized: false };
  }
}

const pgPool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl,
  max: Number(process.env.PGPOOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: Number(process.env.PGCONNECT_TIMEOUT_MS || 15000),
  application_name: 'PlumbPro API',
});

function toPostgres(sql, values = []) {
  let index = 0;
  // Project SQL uses mysql2's positional ? placeholders. Convert them in order.
  const text = sql.replace(/\?/g, () => `$${++index}`);
  if (index !== values.length) {
    throw new Error(`SQL placeholder mismatch: expected ${index} values, received ${values.length}.`);
  }
  return { text, values: values.map(value => typeof value === 'boolean' ? (value ? 1 : 0) : value) };
}

function wrapClient(client) {
  return {
    async query(sql, values = []) {
      const statement = toPostgres(sql, values);
      const isInsert = /^\s*INSERT\s/i.test(statement.text);
      // Preserve the existing controller contract (mysql2-style [rows]/[result])
      // while using PostgreSQL underneath. All app tables have an id primary key.
      if (isInsert && !/\bRETURNING\b/i.test(statement.text)) {
        statement.text = `${statement.text.trim().replace(/;$/, '')} RETURNING id`;
      }
      const result = await client.query(statement.text, statement.values);
      if (isInsert) {
        return [{ insertId: result.rows[0]?.id ?? null, affectedRows: result.rowCount }];
      }
      if (/^\s*(UPDATE|DELETE)\s/i.test(statement.text)) {
        return [{ affectedRows: result.rowCount, rowCount: result.rowCount }];
      }
      return [result.rows, result.fields];
    },
    async beginTransaction() { await client.query('BEGIN'); },
    async commit() { await client.query('COMMIT'); },
    async rollback() { await client.query('ROLLBACK'); },
    release() { if (typeof client.release === 'function') client.release(); },
  };
}

const pool = {
  async query(sql, values = []) { return wrapClient(pgPool).query(sql, values); },
  async getConnection() { return wrapClient(await pgPool.connect()); },
  async end() { await pgPool.end(); },
};

async function testConnection() {
  const result = await pgPool.query('SELECT current_database() AS database, version() AS version');
  return result.rows[0];
}

module.exports = { pool, testConnection };
