# Phase 3 — Customer dashboard review

## Delivered changes

- Added customer booking filters for all, active, pending, completed, and closed bookings.
- Added visible counts for all and active bookings and an empty state when a filter has no matches.
- Added a booking-detail API helper and loaded the existing authorized booking-detail endpoint when a customer opens a booking.
- Added a chronological booking status timeline using the existing `booking_status_history` records, including status notes and timestamps.
- Changed date-only booking display to parse year/month/day as a local calendar date, avoiding UTC date shifts in some time zones.
- Kept existing booking creation, cancellation, review, chat, photo and notification flows in place.
- Added Aiven PostgreSQL host, port, database, username, password placeholder and SSL settings to the backend environment example, plus the supplied CA certificate.

## Database compatibility decision

The active backend still uses MySQL/MariaDB through `mysql2`. The supplied Aiven endpoint is PostgreSQL. Aiven values are documented as migration-target settings only and are not wired into the active MySQL pool. This avoids a misleading environment-only database switch that would fail at runtime. The provided password was redacted, so the environment template contains a placeholder.

## Review and test results

- Backend JavaScript syntax checks: run across all backend `.js` files.
- Frontend JSX/JavaScript parse checks: run with the installed TypeScript compiler's JSX parser/transpiler.
- Aiven CA PEM parse: checked with OpenSSL; subject and validity dates are readable.
- ZIP archive integrity: checked after packaging.
- Full Jest suite and live MySQL/PostgreSQL integration tests: not run because project dependencies are not installed in this environment.

## Remaining work

- Run `npm install` at the project root and backend as required by the README, then run the full frontend and backend tests.
- Perform a real PostgreSQL schema/data migration before using the Aiven service as PlumberPRO's primary database.
