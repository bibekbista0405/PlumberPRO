-- PlumbPro PostgreSQL schema for Aiven PostgreSQL. Run once against defaultdb.
-- This schema is PostgreSQL-native; do not run the MySQL database.sql file.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(30) DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','plumber','admin')),
  status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  terms_accepted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plumber_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  profession VARCHAR(160) NOT NULL,
  education VARCHAR(255) DEFAULT '',
  experience_years DECIMAL(4,1) NOT NULL DEFAULT 0,
  work_mode VARCHAR(32) NOT NULL DEFAULT 'solo' CHECK (work_mode IN ('solo','team')),
  available SMALLINT NOT NULL DEFAULT 1,
  location_name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,7) DEFAULT NULL,
  longitude DECIMAL(10,7) DEFAULT NULL,
  service_radius_km DECIMAL(6,2) NOT NULL DEFAULT 15,
  can_travel SMALLINT NOT NULL DEFAULT 1,
  bio TEXT,
  photo_url VARCHAR(255) DEFAULT NULL,
  certifications VARCHAR(255) DEFAULT NULL,
  verified SMALLINT NOT NULL DEFAULT 0,
  verified_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_plumber_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_negotiable SMALLINT NOT NULL DEFAULT 0,
  icon VARCHAR(20) NOT NULL DEFAULT '🔧',
  status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  CONSTRAINT uq_service_name UNIQUE (name),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  plumber_id INTEGER NULL,
  service_id INTEGER NOT NULL,
  address VARCHAR(255) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  description TEXT,
  photo_url VARCHAR(255) DEFAULT NULL,
  completion_photo_url VARCHAR(255) DEFAULT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','assigned','confirmed','on_the_way','arrived','in_progress','completed','reviewed','cancelled','rejected','expired')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_plumber FOREIGN KEY (plumber_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_booking_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS booking_messages (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_message_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booking_status_history (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  changed_by INTEGER NULL,
  note VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_status_history_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_status_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL,
  plumber_id INTEGER NOT NULL,
  rating SMALLINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_plumber FOREIGN KEY (plumber_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plumber_reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER NOT NULL,
  plumber_id INTEGER NOT NULL,
  booking_id INTEGER NULL,
  reason VARCHAR(60) NOT NULL,
  description TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'new' CHECK (status IN ('new','investigating','resolved','dismissed')),
  resolution_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_plumber FOREIGN KEY (plumber_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','resolved','archived','replied')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  is_read SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_push_endpoint UNIQUE (endpoint)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name VARCHAR(60) NOT NULL,
  user_id INTEGER NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_analytics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform_feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN ('customer','plumber')),
  rating SMALLINT NOT NULL,
  comment TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_feedback_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
CREATE INDEX IF NOT EXISTS idx_plumber_location ON plumber_profiles (location_name);
CREATE INDEX IF NOT EXISTS idx_plumber_verified ON plumber_profiles (verified);
CREATE INDEX IF NOT EXISTS idx_plumber_available ON plumber_profiles (available);
CREATE INDEX IF NOT EXISTS idx_booking_customer ON bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_booking_plumber ON bookings (plumber_id);
CREATE INDEX IF NOT EXISTS idx_booking_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_booking_date ON bookings (booking_date);
CREATE INDEX IF NOT EXISTS idx_message_booking ON booking_messages (booking_id, created_at);
CREATE INDEX IF NOT EXISTS idx_status_history_booking ON booking_status_history (booking_id);
CREATE INDEX IF NOT EXISTS idx_review_plumber ON reviews (plumber_id);
CREATE INDEX IF NOT EXISTS idx_report_status ON plumber_reports (status);
CREATE INDEX IF NOT EXISTS idx_report_plumber ON plumber_reports (plumber_id);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages (status);
CREATE INDEX IF NOT EXISTS idx_notification_user_read ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_time ON analytics_events (event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON platform_feedback (status);

-- Seed the standard service catalog without overwriting existing records.
INSERT INTO services (name, description, price, icon, status) VALUES
('Pipe Repair', 'We fix pipe leakage and breakage issues.', 500, '🔧', 'active'),
('Water Leakage', 'Leak detection and repair for residential plumbing.', 700, '💧', 'active'),
('Bathroom Fitting', 'Bathroom fixture installation and repair.', 1500, '🚿', 'active'),
('Kitchen Plumbing', 'Kitchen sink, tap and pipeline installation.', 800, '🍽️', 'active'),
('Drain Cleaning', 'Professional drain blockage cleaning.', 600, '🚰', 'active'),
('Emergency Service', 'Priority support for urgent plumbing problems.', 1200, '⚡', 'active')
ON CONFLICT (name) DO NOTHING;

-- Maintain updated_at automatically, matching the old MySQL ON UPDATE behavior.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_plumber_profiles_updated_at ON plumber_profiles;
CREATE TRIGGER trg_plumber_profiles_updated_at BEFORE UPDATE ON plumber_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_services_updated_at ON services;
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_plumber_reports_updated_at ON plumber_reports;
CREATE TRIGGER trg_plumber_reports_updated_at BEFORE UPDATE ON plumber_reports FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_contact_messages_updated_at ON contact_messages;
CREATE TRIGGER trg_contact_messages_updated_at BEFORE UPDATE ON contact_messages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_platform_feedback_updated_at ON platform_feedback;
CREATE TRIGGER trg_platform_feedback_updated_at BEFORE UPDATE ON platform_feedback FOR EACH ROW EXECUTE FUNCTION set_updated_at();
