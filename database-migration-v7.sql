-- PlumbPro migration v7: platform feedback (distinct from plumber reviews),
-- moderated by admin, powering an addition to the "What customers say"
-- section on the homepage.
-- Run with: mysql -u root -p plumber_portal < database-migration-v7.sql

USE plumber_portal;

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
