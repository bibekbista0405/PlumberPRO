-- PostgreSQL. Site-wide admin switches (e.g. whether service prices are shown publicly).
-- The API also creates this table on first use, so applying it by hand is optional.
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
