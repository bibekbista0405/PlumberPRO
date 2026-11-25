# Tests

Run with:
```
cd backend
npm install
npm test
```

## What's covered

Real, fast, database-free unit tests for the parts of the app where a bug is
most consequential:

- **`bookingStateMachine.test.js`** — the booking lifecycle transition rules
  (PRD section 13: "Backend is authoritative for every state transition").
  This is the single most important piece of business logic in the app — a
  bug here means a double-booked plumber or a booking stuck in the wrong
  state — so it's the highest-value place to have tests.
- **`sanitize.test.js`** — the XSS-stripping utility used on every free-text
  field (names, bios, messages, reports).
- **`auth.test.js`** — JWT signing and that `sanitizeUser` never leaks a
  password hash to the client.

## What's not covered, and why

Controller-level integration tests (actually hitting `/api/bookings`,
`/api/auth`, etc. and checking what lands in the database) are not included
here. That's not an oversight — it's because they need a real, disposable
test database to run against, which depends on your local MySQL setup in a
way these unit tests deliberately don't.

If you want that layer, the pattern is straightforward to add:
1. Create a separate `plumber_portal_test` database from `database.sql`.
2. Add a `.env.test` pointing `DB_NAME` at it.
3. Use `supertest` (already in `devDependencies`) to send real HTTP requests
   at the Express app and assert on the response *and* the resulting DB rows.
4. Truncate the test tables between test files so tests don't depend on
   run order.

That's real work with real value once the app has more than one contributor
— it's just infrastructure-dependent in a way that didn't belong bundled
into this pass without your test-database details.
