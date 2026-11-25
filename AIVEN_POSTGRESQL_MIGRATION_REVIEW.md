# Aiven PostgreSQL migration — review report

## Changes made

- Replaced the MySQL `mysql2` driver with the PostgreSQL `pg` driver.
- Replaced the MySQL connection configuration with a PostgreSQL connection pool using TLS and the included Aiven CA certificate.
- Kept the existing controller call shape through a small compatibility adapter so the existing route/controller structure did not need a rebuild. The adapter converts positional `?` parameters to PostgreSQL `$1`, `$2`, etc., and preserves the existing insert-id / affected-row access pattern.
- Rewrote MySQL-only upserts to PostgreSQL `ON CONFLICT` syntax.
- Rewrote MySQL date interval and date/time expressions for PostgreSQL.
- Reworked coordinate-distance filtering to avoid MySQL's `HAVING` alias behavior.
- Added `database.postgresql.sql` with the 13 application tables, indexes, service catalog, status/rating constraints, foreign keys, and `updated_at` triggers.
- Added `npm run db:check` for a real connection smoke test after the Aiven password is configured.
- Updated setup documentation and environment examples. The frontend never receives database credentials.

## Static verification completed

- All backend source and test JavaScript files passed `node --check`.
- `backend/package.json` parses and includes `pg`; `mysql2` is removed.
- PostgreSQL schema static checks found 13 `CREATE TABLE` statements and no MySQL `AUTO_INCREMENT`, `ENGINE=InnoDB`, or `ON DUPLICATE KEY` syntax.
- Backend SQL scan found no remaining MySQL-only `ON DUPLICATE KEY UPDATE`, `DATE_SUB`, `TIMESTAMP(?, ?)`, or `<=>` expressions.
- ZIP integrity is checked after packaging.

## Not verified in this environment

The Aiven password was not available in the conversation, and no live Aiven connection was made. Therefore the SQL schema has not been executed against your actual Aiven service, and login/register/booking flows have not been integration-tested against it. After adding your password and executing `database.postgresql.sql`, run `npm run db:check`, then test registration and login.

## Database data

This project is configured for a fresh Aiven PostgreSQL database. No MySQL data export/import was performed. If you have no existing production data, simply create the schema.
