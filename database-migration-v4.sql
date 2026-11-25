-- PlumbPro migration v4: reports, richer plumber profiles, negotiable pricing,
-- and a proper contact-message lifecycle (new/read/resolved/archived).
-- Safe to run multiple times where guarded; run with:
--   mysql -u root -p plumber_portal < database-migration-v4.sql

USE plumber_portal;

-- 1) Plumber reports (customer -> admin), backing the new Support panel.
CREATE TABLE IF NOT EXISTS plumber_reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT UNSIGNED NOT NULL,
  plumber_id INT UNSIGNED NOT NULL,
  booking_id INT UNSIGNED NULL,
  reason VARCHAR(60) NOT NULL,
  description TEXT NULL,
  status ENUM('new','investigating','resolved','dismissed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_plumber FOREIGN KEY (plumber_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_report_status (status),
  INDEX idx_report_plumber (plumber_id)
) ENGINE=InnoDB;

-- 2) Richer plumber profile fields: photo, certifications, and a verification
--    checklist counter used to encourage plumbers toward verification.
ALTER TABLE plumber_profiles
  ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255) DEFAULT NULL AFTER bio,
  ADD COLUMN IF NOT EXISTS certifications VARCHAR(255) DEFAULT NULL AFTER education;

-- 3) Services: allow "negotiable" pricing (no fixed price shown to customers).
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS is_negotiable TINYINT(1) NOT NULL DEFAULT 0 AFTER price;

-- 4) Contact messages: replace the narrow 'replied' status with a real
--    lifecycle — new -> read -> resolved, or archived at any point.
--    Existing 'replied' rows are carried forward as 'resolved'.
ALTER TABLE contact_messages
  MODIFY COLUMN status ENUM('new','read','replied','resolved','archived') NOT NULL DEFAULT 'new';
UPDATE contact_messages SET status = 'resolved' WHERE status = 'replied';
ALTER TABLE contact_messages
  MODIFY COLUMN status ENUM('new','read','resolved','archived') NOT NULL DEFAULT 'new';
