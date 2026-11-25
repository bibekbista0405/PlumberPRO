# PlumberPRO — Phase 2 Workflow Improvements

This phase improves the existing booking and plumber workflows without changing the React/Express/MySQL architecture or requiring a database migration.

## Changes

### Booking lifecycle and concurrency
- Customer cancellation now locks the booking row inside a transaction before checking and changing its state. Concurrent cancellation/status updates cannot both act on a stale booking state.
- Admin booking updates now lock the booking row and commit the status, assignment, and history entry together.
- Plumber acceptance locks the plumber profile row and booking row in a transaction. This serializes accept attempts for the same plumber and prevents two simultaneous accept requests from claiming the same exact date/time slot.
- A plumber must have an existing profile that is both verified and available to accept a job.
- Admin reassignment notifies both the previous plumber (when present) and the newly assigned plumber.

### Plumber profile workflow
- Availability and travel preference values are parsed strictly. Values such as the string `"false"` are now treated as false rather than JavaScript-truthy true; ambiguous values are rejected.
- Experience is constrained to 0–60 years and service radius to 1–100 km.
- Text fields are checked against the existing database column limits.
- Changing availability alone no longer invalidates admin verification. Changes to professional claims or service coverage still reset verification, so public listings retain their verification requirement.

### Booking form experience
- The date minimum uses the user's local calendar date rather than UTC, avoiding date-boundary errors in positive-offset time zones.
- The form gives an immediate future date/time check before submission; the backend remains authoritative.
- Optional booking photos are checked for allowed image type and the existing 3 MB limit before upload.
- Preview object URLs are cleaned up to avoid accumulating browser memory.
- If a booking succeeds but its optional photo upload fails, the success screen now tells the customer instead of silently hiding the failure.
- The success heading now accurately says the request was sent; it does not imply the plumber has already accepted it.

### Dashboard counts
- Customer active-service counts include all in-progress travel/arrival states.
- Customer completed counts include reviewed bookings as well as completed bookings.

## Review and verification
- `node --check` passed for all backend JavaScript files.
- TypeScript's parser successfully parsed all 106 project JavaScript/JSX source files.
- Direct Node smoke tests passed for booking input validation and plumber profile validation/boolean parsing.
- Added Jest tests for plumber profile validation in `backend/tests/plumberProfileValidation.test.js`.
- Full Jest and React production builds were not run: dependency installation timed out in this environment. No live MySQL integration test was possible, so transaction behavior still needs verification against the target MySQL/MariaDB instance.
- No SQL schema migration is required for this phase.
