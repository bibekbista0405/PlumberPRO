-- PlumbPro migration v3: repair a legacy `bookings.plumber_id` foreign key.
--
-- WHY YOU NEED THIS:
-- If your database was first created before this project settled on a single
-- `users` table (with role='plumber') for everyone, `bookings.plumber_id` may
-- still have a foreign key pointing at an old, separate `plumbers` table.
-- The application always sends a `users.id` value for plumber_id, so every
-- booking create/update fails with:
--   ER_NO_REFERENCED_ROW_2: Cannot add or update a child row: a foreign key
--   constraint fails (`bookings`, CONSTRAINT `fk_bookings_plumber` ...)
--
-- This script finds whatever foreign key currently sits on
-- bookings.plumber_id, drops it, and re-adds it pointing at users(id), which
-- is what the current codebase (database.sql) expects.
--
-- SAFE TO RUN MULTIPLE TIMES. Run it with:
--   mysql -u root -p plumber_portal < database-migration-v3-fix-plumber-fk.sql

USE plumber_portal;

-- 1) Defensively clear any plumber_id that isn't a real user id, so the new
--    constraint can be added. (On a fresh/dev database this normally affects
--    zero rows.)
UPDATE bookings
SET plumber_id = NULL
WHERE plumber_id IS NOT NULL
  AND plumber_id NOT IN (SELECT id FROM users);

-- 2) Drop whatever FK currently exists on bookings.plumber_id, whatever it's
--    named and whatever table it references (dynamic SQL, since the name
--    varies between the old and new schema).
SET @fk_name := (
  SELECT CONSTRAINT_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'plumber_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);

SET @drop_sql := IF(@fk_name IS NOT NULL,
  CONCAT('ALTER TABLE bookings DROP FOREIGN KEY `', @fk_name, '`'),
  'SELECT 1');
PREPARE stmt FROM @drop_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Re-add the foreign key pointing at the correct table: users(id).
--    Guarded so re-running this script doesn't error if it's already correct.
SET @needs_fk := (
  SELECT COUNT(*) = 0
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'plumber_id'
    AND REFERENCED_TABLE_NAME = 'users'
);
SET @add_sql := IF(@needs_fk,
  'ALTER TABLE bookings ADD CONSTRAINT fk_booking_plumber FOREIGN KEY (plumber_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt2 FROM @add_sql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 4) Same repair for reviews.plumber_id if it also drifted (reviews.plumber_id
--    is NOT NULL, so orphaned rows are deleted rather than nulled — this only
--    ever affects rows left over from the old schema).
DELETE FROM reviews WHERE plumber_id NOT IN (SELECT id FROM users);

SET @fk_name2 := (
  SELECT CONSTRAINT_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reviews'
    AND COLUMN_NAME = 'plumber_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
    AND REFERENCED_TABLE_NAME <> 'users'
  LIMIT 1
);
SET @drop_sql2 := IF(@fk_name2 IS NOT NULL,
  CONCAT('ALTER TABLE reviews DROP FOREIGN KEY `', @fk_name2, '`'),
  'SELECT 1');
PREPARE stmt3 FROM @drop_sql2;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

SET @needs_fk2 := (
  SELECT COUNT(*) = 0
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reviews'
    AND COLUMN_NAME = 'plumber_id'
    AND REFERENCED_TABLE_NAME = 'users'
);
SET @add_sql2 := IF(@needs_fk2,
  'ALTER TABLE reviews ADD CONSTRAINT fk_review_plumber FOREIGN KEY (plumber_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt4 FROM @add_sql2;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- 5) Diagnostic: run this afterwards to confirm both FKs now point at `users`.
-- SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
--   AND TABLE_NAME IN ('bookings','reviews');

-- Note: this script does not touch or drop the old `plumbers` table itself,
-- in case it still holds data you want to review. It's safe to drop manually
-- once you've confirmed the app works correctly:
--   DROP TABLE IF EXISTS plumbers;
