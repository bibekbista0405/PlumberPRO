-- PlumbPro migration v5: indexes for the two hottest read paths in the app —
-- the notification bell (polled every ~20s per logged-in user) and the
-- rating lookup used on every plumber search and profile view.
-- Safe to run multiple times; skips an index if it already exists.
-- Run with:
--   mysql -u root -p plumber_portal < database-migration-v5-indexes.sql

USE plumber_portal;

SET @idx1 := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND INDEX_NAME = 'idx_notification_user_read'
);
SET @sql1 := IF(@idx1 = 0, 'ALTER TABLE notifications ADD INDEX idx_notification_user_read (user_id, is_read)', 'SELECT 1');
PREPARE s1 FROM @sql1; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @idx2 := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' AND INDEX_NAME = 'idx_review_plumber'
);
SET @sql2 := IF(@idx2 = 0, 'ALTER TABLE reviews ADD INDEX idx_review_plumber (plumber_id)', 'SELECT 1');
PREPARE s2 FROM @sql2; EXECUTE s2; DEALLOCATE PREPARE s2;
