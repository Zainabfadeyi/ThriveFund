-- Adds lifecycle timestamps used by auto-completion and virtual account expiry.

SET @schema_name = DATABASE();

SET @has_goals_completed_at = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'goals'
    AND COLUMN_NAME = 'completed_at'
);

SET @sql = IF(
  @has_goals_completed_at = 0,
  'ALTER TABLE goals ADD COLUMN completed_at DATETIME NULL AFTER allow_anonymous',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_goals_closed_at = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'goals'
    AND COLUMN_NAME = 'closed_at'
);

SET @sql = IF(
  @has_goals_closed_at = 0,
  'ALTER TABLE goals ADD COLUMN closed_at DATETIME NULL AFTER completed_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_va_expired_at = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'virtual_accounts'
    AND COLUMN_NAME = 'expired_at'
);

SET @sql = IF(
  @has_va_expired_at = 0,
  'ALTER TABLE virtual_accounts ADD COLUMN expired_at DATETIME NULL AFTER status',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE goals
SET completed_at = COALESCE(completed_at, updated_at, created_at)
WHERE status = 'completed'
  AND completed_at IS NULL;

UPDATE virtual_accounts
SET expired_at = COALESCE(expired_at, created_at)
WHERE status = 'inactive'
  AND expired_at IS NULL;
