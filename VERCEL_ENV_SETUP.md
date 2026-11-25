# PlumberPRO — Vercel + Aiven environment setup

This project uses Aiven PostgreSQL as its database. There is no XAMPP or local MySQL requirement.

## A. Backend Vercel project (`plumberpro-api`)

1. Create/import the backend Vercel project from the repository.
2. Set the project's Root Directory to `backend` (if following the two-project layout).
3. Open **Settings → Environment Variables**.
4. Open `backend/.env.vercel.example` in a text editor.
5. Add each KEY=VALUE entry to Vercel. Replace:
   - `PGPASSWORD` with the Aiven service password from the Aiven service's connection information.
   - `JWT_SECRET` with a new, long, random secret (not the Aiven password).
   - `FRONTEND_URL` with the actual frontend deployment URL, e.g. `https://plumberpro.vercel.app`.
6. Apply variables to Production. Also add them to Preview if you will test preview deployments.
7. Redeploy after adding/changing variables.

The Aiven host, port, database, username and CA file path are already prefilled in the example. The CA certificate is at `backend/certs/aiven-ca.pem` in the repository. Keep the certificate file in the deployed backend project.

## B. Frontend Vercel project (`plumberpro`)

1. Import the same repository as a second Vercel project.
2. Set its Root Directory to the repository root.
3. Open **Settings → Environment Variables**.
4. Add `REACT_APP_API_URL` using the value in the root `.env.vercel.example` after replacing the backend URL with your real API deployment URL.
5. Redeploy the frontend.

## C. Local development

- Copy `backend/.env.example` to `backend/.env` and replace `PGPASSWORD` and `JWT_SECRET`.
- Copy root `.env.example` to root `.env` if you want to override the frontend API URL locally.
- Keep the backend `.env` private. Do not commit it to GitHub.

## D. Important security and deployment notes

- Never put `PGPASSWORD` or `JWT_SECRET` in a React `REACT_APP_*` variable. React variables are bundled into browser code and are public.
- `FRONTEND_URL` is the allowed browser origin for CORS. Set it to the exact frontend domain. For more than one allowed domain, separate them with commas.
- `PGPOOL_MAX=3` is a conservative starting point for serverless deployment. Confirm the Aiven plan's connection limit before increasing it.
- `PGSSL_CA_FILE=./certs/aiven-ca.pem` expects the CA certificate file to be present in the deployed backend package at `backend/certs/aiven-ca.pem`.
- The backend Express app is exported from `backend/src/server.js` for Vercel's Express runtime. Set the backend Vercel project's Root Directory to `backend`; Vercel should detect the Express app from `src/server.js`. The server only starts a standalone listener for local `npm start`; on Vercel it exports the app instead. Verify `/` and `/api/health` after redeploying.
- Vercel function storage is ephemeral. Any uploaded booking images must be moved to persistent object storage before relying on uploads in production.
