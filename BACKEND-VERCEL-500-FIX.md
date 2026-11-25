# Backend Vercel 500 fix

The backend previously called `testConnection()` before `app.listen()` and exited the process if PostgreSQL was unavailable. It also did not export the Express app, and its frontend fallback tried to serve a React build that is deployed separately on Vercel.

The backend now:

- Exports the Express app from `backend/src/server.js` for Vercel's Express runtime.
- Starts a standalone HTTP listener only when run locally with `npm start`.
- Does not terminate the Vercel function just because the database is temporarily unavailable.
- Returns JSON from `/` and an empty `204` response for `/favicon.ico`.
- Checks PostgreSQL at `/api/health`; a database connectivity problem returns `503` without taking down the API runtime.
- Skips serving the React build when running on Vercel, because the frontend is a separate deployment.

## Vercel backend project settings

1. Open the `plumber-pro-backend` Vercel project.
2. In **Settings → General → Root Directory**, set it to `backend` and save.
3. In **Settings → Environment Variables**, confirm the backend variables from `backend/.env.vercel.example` are present for Production. In particular, verify `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `JWT_SECRET`, and `FRONTEND_URL`.
4. Set `FRONTEND_URL` to `https://plumberproo.vercel.app` (no trailing slash).
5. Redeploy the latest commit.

Do not put database credentials or `JWT_SECRET` in the React frontend environment variables.

## Verify after deployment

- `https://plumber-pro-backend.vercel.app/` should return JSON identifying the PlumbPro API.
- `https://plumber-pro-backend.vercel.app/api/health` should return `200` with `database: "connected"`.
- If `/` returns JSON but `/api/health` returns `503`, the Express function is running and the remaining issue is PostgreSQL connectivity or missing database environment variables. Check the backend Vercel Function Logs for the database error.
- If both return `500`, open **Vercel → plumber-pro-backend → Deployments → latest deployment → Functions/Runtime Logs**, reproduce the request, and inspect the first stack trace. A browser's `favicon.ico` error alone does not identify the root cause.
