-- Backfill schema drift for databases created before virtual_accounts.organization_id.

SET @schema_name = DATABASE();

SET @has_virtual_account_org = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'virtual_accounts'
    AND COLUMN_NAME = 'organization_id'
);

SET @sql = IF(
  @has_virtual_account_org = 0,
  'ALTER TABLE virtual_accounts ADD COLUMN organization_id VARCHAR(36) NULL AFTER goal_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE virtual_accounts va
JOIN goals g ON g.id = va.goal_id
SET va.organization_id = g.organization_id
WHERE va.organization_id IS NULL
  AND g.organization_id IS NOT NULL;

SET @has_virtual_account_org_index = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'virtual_accounts'
    AND INDEX_NAME = 'idx_virtual_accounts_org'
);

SET @sql = IF(
  @has_virtual_account_org_index = 0,
  'CREATE INDEX idx_virtual_accounts_org ON virtual_accounts (organization_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
