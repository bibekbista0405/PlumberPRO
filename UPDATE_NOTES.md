# PlumberPro — current update

- Fixed the broken `src/styles/Footer.css` file that contained React/Testimonials code instead of CSS.
- Fixed the `location.hash` React Hook dependency warning in `src/App.js` and preserved anchor scrolling.
- Kept plumber search distance calculation inside the SQL SELECT clause; it is never appended after the JOINs.
- Added clearer browser location-permission status and denial fallback in the plumber search UI.
- Location is requested only after a user action (`Use my location` or an empty-area search), which is the reliable browser permission flow.
- No fake plumber/customer/review data is added.

## Run

Frontend:
`npm install`
`npm start`

Backend:
`cd backend`
`npm install`
`npm run dev`

Keep MySQL/MariaDB running in XAMPP. Production geolocation requires HTTPS.

## Phase 2 — booking and plumber workflows

- Added transactional row locking for customer cancellation, admin booking updates, and plumber job acceptance.
- Prevented concurrent acceptance of two bookings in the same exact date/time slot for one plumber.
- Required verified and available plumber profiles at job acceptance.
- Added reassignment notifications for both the previous and newly assigned plumber.
- Added strict plumber profile boolean/range/text validation; availability-only edits preserve admin verification.
- Improved local-date booking validation, optional photo checks/preview cleanup, and photo-upload failure messaging.
- See `PHASE2_WORKFLOW_REVIEW.md` for the detailed scope and verification limitations.
