USE plumber_portal;

CREATE TABLE IF NOT EXISTS plumber_profiles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  profession VARCHAR(160) NOT NULL DEFAULT 'Plumbing Professional',
  education VARCHAR(255) DEFAULT '',
  experience_years DECIMAL(4,1) NOT NULL DEFAULT 0,
  work_mode ENUM('solo','team') NOT NULL DEFAULT 'solo',
  available TINYINT(1) NOT NULL DEFAULT 1,
  location_name VARCHAR(255) NOT NULL DEFAULT '',
  latitude DECIMAL(10,7) DEFAULT NULL,
  longitude DECIMAL(10,7) DEFAULT NULL,
  service_radius_km DECIMAL(6,2) NOT NULL DEFAULT 15,
  can_travel TINYINT(1) NOT NULL DEFAULT 1,
  bio TEXT,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  verified_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_plumber_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_plumber_location (location_name), INDEX idx_plumber_verified (verified), INDEX idx_plumber_available (available)
) ENGINE=InnoDB;

INSERT INTO plumber_profiles (user_id, profession, location_name, verified)
SELECT u.id, 'Plumbing Professional', 'Location not provided', 0
FROM users u LEFT JOIN plumber_profiles pp ON pp.user_id=u.id
WHERE u.role='plumber' AND pp.id IS NULL;
