# PlumberPRO — Phase 1 Security & Backend Fixes

This update preserves the existing React + Express + MySQL project structure and database schema.

## Changes made

### 1. Public plumber verification
- Public plumber search now requires `plumber_profiles.verified = 1`.
- Public plumber profile lookup now returns only active, verified plumber profiles.
- Existing availability and active-account requirements remain in place.

### 2. Booking photo upload authorization
- Added `backend/src/middleware/bookingUploadAccess.js`.
- Customer ownership and eligible booking status are checked before Multer writes the uploaded file.
- Plumber assignment and eligible completion status are checked before completion-photo upload.
- Controller-level checks remain as defense in depth.
- Newly uploaded files are removed if the final controller check or database update fails.

### 3. Booking input validation
- Added `backend/src/utils/bookingValidation.js`.
- Validates positive integer service/plumber IDs.
- Validates real calendar dates (`YYYY-MM-DD`) including leap years.
- Validates 24-hour times (`HH:MM`, optional seconds).
- Validates address and description types/lengths.
- Rejects bookings whose requested date/time is earlier than the MySQL server's current time.

### 4. Plumber assignment validation
- Customer-selected plumbers must be active, available and verified.
- Admin reassignment now also requires an active, available and verified plumber, and validates the supplied plumber ID and admin note.

### 5. Tests
- Added `backend/tests/bookingValidation.test.js` for booking payload validation.

## Verification performed
- `node --check` passed for all backend source and test JavaScript files.
- Direct Node smoke checks passed for the booking validation utility.
- Full Jest suite could not be run in this environment because dependencies were not installed; `npm ci` timed out and Jest was therefore unavailable.
- Database-backed integration tests were not run because no project MySQL instance or test database was configured in this environment.

## Important deployment note
No database schema migration is required for these changes. Existing `.env` values and MySQL data are not modified. Before production deployment, run the full backend test suite and test booking creation/photo upload against a disposable MySQL database.
