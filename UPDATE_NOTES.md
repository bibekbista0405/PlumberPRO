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
