
require('dotenv').config({
  path: require('path').join(__dirname, '.env')
});

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function test() {
  console.log('Database host:', process.env.PGHOST);
  console.log('Database port:', process.env.PGPORT);
  console.log('Database name:', process.env.PGDATABASE);
  console.log('Database user:', process.env.PGUSER);
  console.log('Password loaded:', Boolean(process.env.PGPASSWORD));

  const client = new Client({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync(
        path.join(__dirname, 'certs', 'aiven-ca.pem'),
        'utf8'
      ),
    },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    const result = await client.query('SELECT VERSION()');
    console.log('AIVEN CONNECTION SUCCESSFUL');
    console.log(result.rows[0].version);
  } catch (error) {
    console.error('AIVEN CONNECTION FAILED');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
  } finally {
    await clientc.end().catch(() => {});
  }
}

test();
c