# PlumbPro — Aiven PostgreSQL setup

PlumbPro now uses **Aiven PostgreSQL as its only database**. XAMPP/MySQL is not used by the backend.

## 1. Configure the backend environment

From the project root, copy `backend/.env.example` to `backend/.env`. Keep the supplied Aiven host, port, database, and username. Replace only `PGPASSWORD` with the actual password from your Aiven service. Keep `PGSSL=true`, `PGSSL_REJECT_UNAUTHORIZED=true`, and `PGSSL_CA_FILE=./certs/aiven-ca.pem`. The CA file is included at `backend/certs/aiven-ca.pem`.

Never put the Aiven password in frontend environment variables, React code, GitHub, screenshots, or public messages. `backend/.env` is ignored by Git.

## 2. Create the database tables

1. Open the Aiven service in the Aiven Console.
2. Open **Query editor** (or connect with pgAdmin / DBeaver).
3. Open the project-root file `database.postgresql.sql`.
4. Execute the complete SQL against the `defaultdb` database.
5. Confirm that the application tables were created.

Do **not** import `database.sql` or any `database-migration-*.sql` MySQL files into PostgreSQL. `database.postgresql.sql` is the PostgreSQL-native schema and includes the default service catalog.

## 3. Install and start

```powershell
cd backend
npm install
npm start
```

The backend health endpoint is `http://localhost:5000/api/health`. A healthy response reports `database: postgresql`.

In a second terminal, from the project root:

```powershell
npm install
npm start
```

The React development server uses the existing proxy to send `/api` requests to port 5000. Restart it after changing configuration.

## 4. Create the first admin

After the schema is installed, run this from the `backend` folder:

```powershell
node src/utils/seedAdmin.js admin@example.com "Use-A-Strong-Password" "PlumbPro Admin"
```

Use your own email and a unique strong password. Do not reuse the example password.

## Important migration note

This setup creates a clean PostgreSQL schema. If your old MySQL database contained real users, bookings, or other records, those records are **not automatically copied**. Export and migrate them separately before deleting or abandoning the old database.
