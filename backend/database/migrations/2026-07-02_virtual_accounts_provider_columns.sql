-- Backfill schema drift for older virtual_accounts tables.
-- Older deployments used nomba_account_id and did not store provider/provider_account_id.

SET @schema_name = DATABASE();

SET @has_provider = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'virtual_accounts'
    AND COLUMN_NAME = 'provider'
);

SET @sql = IF(
  @has_provider = 0,
  'ALTER TABLE virtual_accounts ADD COLUMN provider ENUM(''nomba'') NOT NULL DEFAULT ''nomba'' AFTER organization_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_provider_account_id = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'virtual_accounts'
    AND COLUMN_NAME = 'provider_account_id'
);

SET @sql = IF(
  @has_provider_account_id = 0,
  'ALTER TABLE virtual_accounts ADD COLUMN provider_account_id VARCHAR(255) NULL AFTER provider',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_nomba_account_id = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'virtual_accounts'
    AND COLUMN_NAME = 'nomba_account_id'
);

SET @sql = IF(
  @has_nomba_account_id > 0,
  'UPDATE virtual_accounts SET provider_account_id = COALESCE(provider_account_id, nomba_account_id)',
  'UPDATE virtual_accounts SET provider_account_id = COALESCE(provider_account_id, provider_reference)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE virtual_accounts
SET provider_account_id = provider_reference
WHERE provider_account_id IS NULL;

ALTER TABLE virtual_accounts
  MODIFY COLUMN provider_account_id VARCHAR(255) NOT NULL,
  MODIFY COLUMN status ENUM('active','inactive','pending') NOT NULL DEFAULT 'active';
