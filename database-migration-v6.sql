-- PlumbPro migration v6: booking chat, photo evidence, web push, self-hosted
-- analytics, report resolution notes, and terms-acceptance tracking.
-- Safe to run against an existing database. Run with:
--   mysql -u root -p plumber_portal < database-migration-v6.sql

USE plumber_portal;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255) DEFAULT NULL AFTER description,
  ADD COLUMN IF NOT EXISTS completion_photo_url VARCHAR(255) DEFAULT NULL AFTER photo_url;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP NULL DEFAULT NULL AFTER status;

ALTER TABLE plumber_reports
  ADD COLUMN IF NOT EXISTS resolution_note TEXT NULL AFTER status;

CREATE TABLE IF NOT EXISTS booking_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  sender_id INT UNSIGNED NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_message_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_message_booking (booking_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_push_endpoint (endpoint(255)),
  INDEX idx_push_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_name VARCHAR(60) NOT NULL,
  user_id INT UNSIGNED NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_analytics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_analytics_event_time (event_name, created_at)
) ENGINE=InnoDB;

-- Note: "ADD COLUMN IF NOT EXISTS" requires MySQL 8.0.29+ or MariaDB 10.5+.
-- If your server is older, remove "IF NOT EXISTS" and run each ALTER once.
