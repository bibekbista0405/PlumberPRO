# PlumberPRO build-fix delivery

## Vercel failure addressed

The deployment at commit `3508c61` failed because `PlumberDashboard.jsx` used `useCallback` three times without importing it from React. The React import now includes `useCallback`. This resolves the reported ESLint `no-undef` errors without disabling linting or changing dashboard behavior.

The earlier AdminDashboard `load` dependency correction is retained: `load` is memoized with `useCallback([analyticsRange])` and the effect depends on `[load]`.

## Verification limits

The supplied Vercel log is the authoritative evidence for the failed deployment. In this workspace, `CI=true npm run build` could not run because `react-scripts` was not installed. Attempts to install dependencies with `npm ci --no-audit --no-fund` timed out. Therefore this package is source-corrected but a successful local production build is **not claimed**. Re-run `CI=true npm run build` in Vercel or after a successful `npm ci`.

Backend JavaScript syntax and package JSON validation should be run before release.

## Environment/security

Real `.env` files are intentionally excluded from this archive. Configure `REACT_APP_API_URL` as a Vercel frontend environment variable pointing to the deployed Express API base URL. Keep PostgreSQL/Aiven credentials and JWT secrets only in backend environment variables.

The `Unknown env config "cache-dir"` warning is not produced by source files in this repository (there is no checked-in `.npmrc`). Check Vercel project environment variables and remove an incorrectly named `NPM_CONFIG_CACHE_DIR`/`npm_config_cache_dir` variable if present; npm's supported setting is `cache`, not `cache-dir`. Deprecation notices are dependency-tree warnings, not the reported compile failure.
