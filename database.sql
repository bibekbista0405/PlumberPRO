CREATE DATABASE IF NOT EXISTS plumber_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE plumber_portal;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(30) DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer','plumber','admin') NOT NULL DEFAULT 'customer',
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  terms_accepted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role), INDEX idx_users_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plumber_profiles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  profession VARCHAR(160) NOT NULL,
  education VARCHAR(255) DEFAULT '',
  experience_years DECIMAL(4,1) NOT NULL DEFAULT 0,
  work_mode ENUM('solo','team') NOT NULL DEFAULT 'solo',
  available TINYINT(1) NOT NULL DEFAULT 1,
  location_name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,7) DEFAULT NULL,
  longitude DECIMAL(10,7) DEFAULT NULL,
  service_radius_km DECIMAL(6,2) NOT NULL DEFAULT 15,
  can_travel TINYINT(1) NOT NULL DEFAULT 1,
  bio TEXT,
  photo_url VARCHAR(255) DEFAULT NULL,
  certifications VARCHAR(255) DEFAULT NULL,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  verified_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_plumber_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_plumber_location (location_name), INDEX idx_plumber_verified (verified), INDEX idx_plumber_available (available)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS services (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_negotiable TINYINT(1) NOT NULL DEFAULT 0,
  icon VARCHAR(20) NOT NULL DEFAULT '🔧',
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  UNIQUE KEY uq_service_name (name), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  plumber_id INT UNSIGNED NULL,
  service_id INT UNSIGNED NOT NULL,
  address VARCHAR(255) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  description TEXT,
  photo_url VARCHAR(255) DEFAULT NULL,
  completion_photo_url VARCHAR(255) DEFAULT NULL,
  status ENUM('pending','assigned','confirmed','on_the_way','arrived','in_progress','completed','reviewed','cancelled','rejected','expired') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_plumber FOREIGN KEY (plumber_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_booking_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  INDEX idx_booking_customer (customer_id), INDEX idx_booking_plumber (plumber_id), INDEX idx_booking_status (status), INDEX idx_booking_date (booking_date)
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS booking_status_history (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL,
  changed_by INT UNSIGNED NULL,
  note VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_status_history_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_status_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status_history_booking (booking_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL UNIQUE,
  customer_id INT UNSIGNED NOT NULL,
  plumber_id INT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_plumber FOREIGN KEY (plumber_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_review_plumber (plumber_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plumber_reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT UNSIGNED NOT NULL,
  plumber_id INT UNSIGNED NOT NULL,
  booking_id INT UNSIGNED NULL,
  reason VARCHAR(60) NOT NULL,
  description TEXT NULL,
  status ENUM('new','investigating','resolved','dismissed') NOT NULL DEFAULT 'new',
  resolution_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_plumber FOREIGN KEY (plumber_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_report_status (status),
  INDEX idx_report_plumber (plumber_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL, email VARCHAR(190) NOT NULL, subject VARCHAR(200) NOT NULL, message TEXT NOT NULL,
  status ENUM('new','read','resolved','archived') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_contact_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL, title VARCHAR(180) NOT NULL, message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notification_user_read (user_id, is_read)
) ENGINE=InnoDB;

-- Web Push subscriptions (free, browser-native — no SMS/payment gateway needed).
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

-- Lightweight, self-hosted product analytics (no third-party service needed).
-- Deliberately narrow: an event name, an optional user, and small metadata —
-- enough to see real funnels (search -> booking -> completion) without
-- collecting anything sensitive.
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_name VARCHAR(60) NOT NULL,
  user_id INT UNSIGNED NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_analytics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_analytics_event_time (event_name, created_at)
) ENGINE=InnoDB;

-- Platform feedback: how customers/plumbers feel about PlumbPro itself, not
-- a review of a specific plumber (that's the `reviews` table). Admin-approved
-- entries feed the "What customers say" section on the homepage.
CREATE TABLE IF NOT EXISTS platform_feedback (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  role ENUM('customer','plumber') NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_feedback_user (user_id),
  INDEX idx_feedback_status (status)
) ENGINE=InnoDB;

INSERT IGNORE INTO services (name, description, price, icon, status) VALUES
('Pipe Repair', 'We fix pipe leakage and breakage issues.', 500, '🔧', 'active'),
('Water Leakage', 'Leak detection and repair for residential plumbing.', 700, '💧', 'active'),
('Bathroom Fitting', 'Bathroom fixture installation and repair.', 1500, '🚿', 'active'),
('Kitchen Plumbing', 'Kitchen sink, tap and pipeline installation.', 800, '🍽️', 'active'),
('Drain Cleaning', 'Professional drain blockage cleaning.', 600, '🚰', 'active'),
('Emergency Service', 'Priority support for urgent plumbing problems.', 1200, '⚡', 'active')
ON DUPLICATE KEY UPDATE name=VALUES(name);
