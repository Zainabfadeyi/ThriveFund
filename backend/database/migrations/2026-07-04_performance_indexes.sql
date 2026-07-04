-- Adds indexes for dashboard, campaign detail, reconciliation, and payout flows.

SET @schema_name = DATABASE();

SET @has_idx = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'transactions' AND INDEX_NAME = 'idx_transactions_goal_status_paid'
);
SET @sql = IF(
  @has_idx = 0,
  'CREATE INDEX idx_transactions_goal_status_paid ON transactions (goal_id, status, paid_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_idx = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'transactions' AND INDEX_NAME = 'idx_transactions_goal_contributor'
);
SET @sql = IF(
  @has_idx = 0,
  'CREATE INDEX idx_transactions_goal_contributor ON transactions (goal_id, contributor_name)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_idx = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'contributors' AND INDEX_NAME = 'idx_contributors_goal_name'
);
SET @sql = IF(
  @has_idx = 0,
  'CREATE INDEX idx_contributors_goal_name ON contributors (goal_id, name)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_idx = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'withdrawals' AND INDEX_NAME = 'idx_withdrawals_goal_status'
);
SET @sql = IF(
  @has_idx = 0,
  'CREATE INDEX idx_withdrawals_goal_status ON withdrawals (goal_id, status)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_idx = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'virtual_accounts' AND INDEX_NAME = 'idx_virtual_accounts_account_number'
);
SET @sql = IF(
  @has_idx = 0,
  'CREATE INDEX idx_virtual_accounts_account_number ON virtual_accounts (account_number)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
