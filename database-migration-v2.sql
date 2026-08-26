-- PlumbPro migration v2: fuller booking lifecycle + status history
-- Safe to run against an existing plumber_portal database.
USE plumber_portal;

ALTER TABLE bookings
  MODIFY COLUMN status ENUM('pending','assigned','confirmed','on_the_way','arrived','in_progress','completed','reviewed','cancelled','rejected','expired') NOT NULL DEFAULT 'pending';

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
