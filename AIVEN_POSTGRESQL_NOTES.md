# Aiven PostgreSQL connection details

The connection values supplied for Aiven have been added to `backend/.env.example` and copied into `backend/.env.aiven.example`. The supplied Project CA certificate is stored at `backend/certs/aiven-ca.pem`.

## Important compatibility note

The current PlumberPRO application is built around MySQL/MariaDB: it uses the `mysql2` package, MySQL connection-pool APIs, `?` placeholders, and MySQL-specific SQL. The Aiven service supplied here is PostgreSQL. The current runtime therefore **does not connect to Aiven** merely by adding these environment variables. Do not replace `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, or `DB_NAME` with the Aiven values.

A proper migration requires a planned database adapter/schema migration, SQL dialect updates, migration of existing data, and integration tests against a PostgreSQL instance. Until that work is completed, the existing MySQL settings remain the active database configuration.

## Configure the local environment

1. Copy `backend/.env.example` to `backend/.env` (or merge the Aiven block into your existing local file).
2. Set `AIVEN_PG_PASSWORD` to the actual Aiven password in your local `.env`. The password was redacted in the details shared in chat, so no password has been inserted.
3. Keep `AIVEN_PG_SSL=true`, `AIVEN_PG_SSL_REJECT_UNAUTHORIZED=true`, and `AIVEN_PG_SSL_CA_FILE=./certs/aiven-ca.pem`.
4. Keep the current `DB_*` variables pointing at your working MySQL/MariaDB database until the PostgreSQL migration is explicitly completed.

The CA certificate is public trust material, not a database password. Never commit a real `.env` file or share the Aiven password.
