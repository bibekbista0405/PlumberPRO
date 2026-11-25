# PlumbPro — Full-stack plumbing service platform

PlumbPro is a React + Express + MySQL/MariaDB application for customers, plumbers and administrators.

## Stack

- React + React Router
- Node.js + Express
- MySQL/MariaDB through XAMPP
- JWT + bcrypt authentication
- Browser Geolocation API for opt-in location discovery
- OpenStreetMap Nominatim for optional reverse-geocoding of an explicitly shared location

## Local setup

### 1. XAMPP

Start **MySQL** in XAMPP. Apache is not required for the React/Express development setup.

Open phpMyAdmin:

`http://localhost/phpmyadmin`

For a fresh database, import `database.sql`.

If you already have the previous PlumbPro database, run `database-migration.sql` once against `plumber_portal` to create `plumber_profiles` and migrate existing plumber users into profile records.

### 2. Backend

Create `backend/.env` from `backend/.env.example` and configure:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=plumber_portal
DB_USER=root
DB_PASSWORD=
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
4. The profile is stored in MySQL with `verified = 0`.
5. An admin reviews the profile and verifies it.
6. Only active, available and verified plumbers appear in public search.
7. Customer search can use an area name or opt-in coordinates.
8. Coordinate searches compare the customer's requested radius with the plumber's service radius.
9. Completed bookings can be rated by customers. Ratings are calculated from real reviews.

## No fake operational data

The application does not create fake customers, plumbers, bookings, reviews or messages. The default service catalog in `database.sql` is configuration for the actual service menu; operational records are created through the application.

## Production notes

- Replace the local MySQL database with a hosted MySQL/MariaDB-compatible database for deployment.
- Use HTTPS before enabling production geolocation.
- Review the privacy policy and obtain legal review before launch.
- Review OpenStreetMap Nominatim usage requirements before production use; a dedicated geocoding provider may be preferable for scale.

## PlumbPro local setup

### 1. MySQL / XAMPP

Start **MySQL** in XAMPP and use the existing `plumber_portal` database. For an older database, run `database-migration.sql` in phpMyAdmin before starting the API.

### 2. Backend

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, and `FRONTEND_URL` in `backend/.env`.

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

Public search only returns plumbers that exist in MySQL and are active, available, and admin-verified. Ratings and review counts come from the real `reviews` table.
