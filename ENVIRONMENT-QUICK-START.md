# PlumberPRO environment quick start (Aiven + Vercel)

## Local development

1. Open `backend/.env` and replace:
   - `PGPASSWORD` with the Aiven service password.
   - `JWT_SECRET` with a unique random secret (at least 32 characters).
2. Root `.env` is already set to `http://localhost:5000/api` for local development.
3. Start the backend from `backend/`, then start the React app from the repository root.

## Vercel deployment (two separate projects)

The `.env` files are for local development. Vercel does not automatically read an uploaded `.env` file from the ZIP or Git repository. Add the variables in each Vercel project's Settings > Environment Variables.

### Backend project

When importing the repository, select **Import single project** on the `backend` application card. Set Root Directory to `backend`. Add the entries from `backend/.env.vercel.example` to this project's Environment Variables. Replace the Aiven password, JWT secret, and frontend URL. Do not set the local development `PORT` unless the backend deployment instructions require it.

### Frontend project

Import the repository again as a second Vercel project. Select **Import single project** on the `app` (Create React App) card. Set Root Directory to the repository root (`./`). Add the one variable from root `.env.vercel.example`:

`REACT_APP_API_URL=https://YOUR-BACKEND-PROJECT.vercel.app/api`

Replace the URL with the actual backend deployment URL, then redeploy the frontend.

## Security

- Never commit `backend/.env` or root `.env` to GitHub.
- Never put the Aiven password or JWT secret in frontend variables or React source code.
- Rotate the Aiven password if it has ever been committed or publicly shared.
