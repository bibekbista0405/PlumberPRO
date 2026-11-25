# PlumberPRO build-fix delivery

## Included source changes

This delivery applies the React Hook dependency corrections to:

- `src/pages/AdminDashboard.jsx`
- `src/components/BookingChat.jsx`
- `src/components/MessagesInbox.jsx`
- `src/pages/CustomerDashboard.jsx`
- `src/pages/PlumberDashboard.jsx`

The existing dashboard/API logic is retained; callbacks are stabilized with `useCallback` and effects depend on those callbacks rather than suppressing `react-hooks/exhaustive-deps`.

## Vercel log supplied by the project owner

The supplied deployment log is successful: Vercel reports `Build Completed in /vercel/output` and `Deployment completed`. The `cache-dir`, deprecated `inflight`, `glob`, and `multer` messages are npm warnings, not errors in that deployment.

The `cache-dir` warning is emitted by npm from an environment configuration value; it is not configured in this repository. Check Vercel Project Settings > Environment Variables for an `NPM_CONFIG_CACHE_DIR` / `npm_config_cache_dir` entry and remove it if present. Do not add `CI=false`.

The Multer 1.x deprecation warning is emitted by the backend dependency declaration. This delivery does not make an unverified major-version dependency migration; validate a Multer 2 migration against the upload middleware and deployed backend separately. `inflight` and `glob` are dependency-tree warnings.

## Build verification status

The source patch was applied cleanly. Backend JavaScript files passed `node --check`; root and backend `package.json` files parsed successfully. A local `CI=true npm run build` could not be completed in the build environment because `npm ci` timed out while fetching dependencies and `react-scripts` was therefore unavailable. This is not represented as a successful local production build.

The supplied Vercel log independently confirms that the deployment represented by that log completed successfully, but it does not verify this updated ZIP until it is committed and deployed.

## Environment and secrets

Real `.env` files were intentionally excluded from this ZIP. Configure these values in Vercel/backend hosting settings instead. Example environment files are retained. Keep Aiven credentials, JWT secrets, mail credentials, and VAPID private keys server-side.

## Deploying the updated project

1. Extract this ZIP and review the five changed frontend files.
2. Configure `REACT_APP_API_URL` to the deployed API base URL in Vercel's frontend project settings.
3. Configure PostgreSQL/Aiven and JWT secrets only in backend hosting environment variables.
4. Commit and push the updated source, then redeploy on Vercel.
5. Confirm the new deployment log includes `Build Completed` and `Deployment completed`.
