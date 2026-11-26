# Vercel PostgreSQL SSL CA fix

The runtime log `self-signed certificate in certificate chain` means Node.js did not trust the certificate chain presented by PostgreSQL. The local Aiven test succeeds when the project CA is supplied, so the Vercel deployment must load the same CA file.

## Required deployment files

Confirm this file is committed to GitHub and included in the Vercel deployment:

`backend/certs/aiven-ca.pem`

The backend database configuration now resolves `PGSSL_CA_FILE` relative to the backend package and defaults to `./certs/aiven-ca.pem`. With certificate verification enabled, it fails with a clear missing-file error instead of silently falling back to the system trust store.

## Vercel Production variables

- `PGSSL=true`
- `PGSSL_REJECT_UNAUTHORIZED=true`
- `PGSSL_CA_FILE=./certs/aiven-ca.pem`

Keep the existing Aiven host, port, database, user, and password values. Do not paste credentials into source files or chat.

After pushing the updated project, redeploy the backend. The runtime logs should contain a line similar to:

`PostgreSQL SSL CA certificate loaded from /var/task/backend/certs/aiven-ca.pem`

If it reports that the CA file was not found, ensure `backend/certs/aiven-ca.pem` is tracked by Git and present in the deployment.

## Other log warning

The `express-rate-limit` IPv6 key-generator warning is also corrected by using the package's `ipKeyGenerator` helper for anonymous IP-based rate-limit keys. It was separate from the PostgreSQL SSL failure.

## Verification status

JavaScript syntax and archive integrity were checked locally. A live Vercel deployment and Aiven connection from Vercel have not been run from this environment.
