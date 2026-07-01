-- Adds expected payer tracking for tuition, dues, levies, and structured collections.

SET @schema_name = DATABASE();

SET @has_group_label = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'contributors'
    AND COLUMN_NAME = 'group_label'
);

SET @sql = IF(
  @has_group_label = 0,
  'ALTER TABLE contributors ADD COLUMN group_label VARCHAR(255) NULL AFTER phone_number',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_expected_amount = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'contributors'
    AND COLUMN_NAME = 'expected_amount'
);

SET @sql = IF(
  @has_expected_amount = 0,
  'ALTER TABLE contributors ADD COLUMN expected_amount DECIMAL(15,2) NULL AFTER group_label',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_goal_email_index = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'contributors'
    AND INDEX_NAME = 'uq_contributors_goal_email'
);

SET @sql = IF(
  @has_goal_email_index = 0,
  'CREATE UNIQUE INDEX uq_contributors_goal_email ON contributors (goal_id, email)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
