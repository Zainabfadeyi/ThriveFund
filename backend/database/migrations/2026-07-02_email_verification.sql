-- Adds email verification tracking for organization onboarding.

SET @schema_name = DATABASE();

SET @has_email_verified_at = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'email_verified_at'
);

SET @sql = IF(
  @has_email_verified_at = 0,
  'ALTER TABLE users ADD COLUMN email_verified_at DATETIME NULL AFTER role',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS email_verifications (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token      VARCHAR(512)    NOT NULL,
  user_id    VARCHAR(36)     NOT NULL,
  used       TINYINT(1)      NOT NULL DEFAULT 0,
  expires_at DATETIME        NOT NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email_verifications_token (token(255)),
  KEY idx_email_verifications_user (user_id),
  CONSTRAINT fk_email_verifications_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
