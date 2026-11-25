# CORS and backend API URL fix

## Why registration failed

The browser console showed requests to `https://plumber-pro-backend.vercel.app//auth/register`.
The Express API mounts authentication at `/api/auth`, so the correct endpoint is
`https://plumber-pro-backend.vercel.app/api/auth/register`. The double slash can
trigger a Vercel redirect, and browsers do not follow redirects for CORS preflight
requests.

## Frontend Vercel environment variable

In the **frontend** Vercel project, set this for Production (and Preview if used):

```text
REACT_APP_API_URL=https://plumber-pro-backend.vercel.app/api
```

The updated frontend normalizes the base URL, so an origin-only value is also
normalized to `/api`; nevertheless, the explicit value above is recommended.
After changing a `REACT_APP_*` variable, redeploy the frontend because Create React
App embeds it into the production JavaScript bundle at build time.

## Backend Vercel environment variable

In the **backend** Vercel project, set:

```text
FRONTEND_URL=https://plumberproo.vercel.app
```

For multiple trusted frontend origins, separate exact origins with commas. Do not
include wildcard origins. The backend normalizes trailing slashes before comparing
the browser Origin header. CORS middleware handles OPTIONS preflight before the
rate limiter and API routes.

## Verification

After redeploying both projects, check these endpoints:

- `https://plumber-pro-backend.vercel.app/api/health`
- `https://plumber-pro-backend.vercel.app/api/services`

The browser Network panel should show requests to `/api/...`, not `//...` or bare
`/auth/...`. The registration POST should have a successful OPTIONS preflight and
then return the API's JSON response. If `/api/health` itself redirects or returns
404/500, investigate the backend Vercel project routing/runtime separately; changing
frontend CORS settings cannot repair a backend deployment that does not serve the API.
