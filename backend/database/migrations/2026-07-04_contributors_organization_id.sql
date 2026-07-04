-- Optional organization_id on contributors (schema.sql includes it; older RDS instances may not).

SET @schema_name = DATABASE();

SET @has_contributors_organization_id = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'contributors'
    AND COLUMN_NAME = 'organization_id'
);

SET @sql = IF(
  @has_contributors_organization_id = 0,
  'ALTER TABLE contributors ADD COLUMN organization_id VARCHAR(36) NULL AFTER goal_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE contributors c
JOIN goals g ON g.id = c.goal_id
SET c.organization_id = g.organization_id
WHERE c.organization_id IS NULL
  AND g.organization_id IS NOT NULL;
