-- Scheduled virtual-account expiry after campaign completion (grace period safety net).

SET @schema_name = DATABASE();

SET @has_collection_expires_at = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'goals'
    AND COLUMN_NAME = 'collection_expires_at'
);

SET @sql = IF(
  @has_collection_expires_at = 0,
  'ALTER TABLE goals ADD COLUMN collection_expires_at DATETIME NULL AFTER closed_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE goals g
JOIN virtual_accounts va ON va.goal_id = g.id AND va.status = 'active'
SET g.collection_expires_at = DATE_ADD(COALESCE(g.completed_at, NOW()), INTERVAL 7 DAY)
WHERE g.status = 'completed'
  AND g.collection_expires_at IS NULL;
