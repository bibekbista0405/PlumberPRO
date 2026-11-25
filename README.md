# PlumbPro — Full-stack plumbing service platform

PlumbPro is a React + Express application backed by Aiven PostgreSQL for customers, plumbers and administrators.

## Stack

- React + React Router
- Node.js + Express
- Aiven PostgreSQL (TLS-encrypted connection)
- JWT + bcrypt authentication
- Browser Geolocation API for opt-in location discovery
- OpenStreetMap Nominatim for optional reverse-geocoding of an explicitly shared location

## Local setup

### 1. Aiven PostgreSQL

Open your Aiven PostgreSQL service and run the PostgreSQL-native schema in `database.postgresql.sql` against `defaultdb`. No local database server or XAMPP installation is required.

### 2. Backend

Create `backend/.env` from `backend/.env.example` and configure:

```env
PORT=5000
PGHOST=your-aiven-host.aivencloud.com
PGPORT=your-aiven-port
PGDATABASE=defaultdb
PGUSER=avnadmin
PGPASSWORD=your-aiven-password
PGSSL=true
PGSSL_REJECT_UNAUTHORIZED=true
PGSSL_CA_FILE=./certs/aiven-ca.pem
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

Then:

```powershell
cd backend
npm install
npm run dev
```

### 3. Frontend

In another terminal:

```powershell
npm install
npm start
```

Open `http://localhost:3000`.

## Plumber workflow

1. A plumber chooses **Plumber** during registration.
2. The browser asks for location permission. Permission is optional.
3. The plumber provides profession, education/training, experience, solo/team model, availability, service area, service radius and travel capability.
4. The profile is stored in Aiven PostgreSQL with `verified = 0`.
5. An admin reviews the profile and verifies it.
6. Only active, available and verified plumbers appear in public search.
7. Customer search can use an area name or opt-in coordinates.
8. Coordinate searches compare the customer's requested radius with the plumber's service radius.
9. Completed bookings can be rated by customers. Ratings are calculated from real reviews.

## No fake operational data

The application does not create fake customers, plumbers, bookings, reviews or messages. The default service catalog in `database.postgresql.sql` is configuration for the actual service menu; operational records are created through the application.

## Production notes

- The backend connects to Aiven PostgreSQL using TLS. Keep the database password only in `backend/.env` or your hosting provider’s secret environment variables.
- Use HTTPS before enabling production geolocation.
- Review the privacy policy and obtain legal review before launch.
- Review OpenStreetMap Nominatim usage requirements before production use; a dedicated geocoding provider may be preferable for scale.

## PlumbPro local setup

### 1. Aiven PostgreSQL

Create the tables by executing `database.postgresql.sql` against your Aiven `defaultdb` database. Configure the `PG*` variables in `backend/.env` as described in `AIVEN_POSTGRESQL_NOTES.md`. No local database server is required.

### 2. Backend

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

Set `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, the SSL settings, `JWT_SECRET`, and `FRONTEND_URL` in `backend/.env`.

### 3. Frontend

```powershell
npm install
npm start
```

The frontend runs at `http://localhost:3000` and the API at `http://localhost:5000` by default.

### Location-aware plumber search

The homepage hero includes a real plumber search. If a user searches without entering an area, PlumbPro requests browser location permission. The browser prompt is triggered by the user's action on **Find plumbers** or **Use my location**. Coordinates are used only to calculate nearby service matches; the UI explains this before/while requesting permission.

For deployed location search, serve the site over HTTPS. Browsers allow geolocation on secure contexts (with `localhost` supported for local development).

### No fake plumber data

Public search only returns plumbers that exist in Aiven PostgreSQL and are active, available, and admin-verified. Ratings and review counts come from the real `reviews` table.
