-- ThriveFund Database Schema — MySQL 8.0
-- Modular monolith · Payment operations platform
-- Run: mysql -h <host> -u admin -p thrivefund < database/schema.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)   NOT NULL,
  full_name     VARCHAR(255)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  phone_number  VARCHAR(20)   NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  email_verified_at DATETIME   NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NULL     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ORGANIZATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id          VARCHAR(36)   NOT NULL,
  name        VARCHAR(255)  NOT NULL,
  slug        VARCHAR(255)  NOT NULL,
  type        ENUM('school','mosque','church','cooperative','association','ngo','business','event','other') NOT NULL DEFAULT 'other',
  description TEXT          NULL,
  email       VARCHAR(255)  NULL,
  phone       VARCHAR(20)   NULL,
  address     VARCHAR(500)  NULL,
  owner_id    VARCHAR(36)   NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NULL     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_organizations_slug (slug),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_organizations_type (type),
  INDEX idx_organizations_owner (owner_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ORGANIZATION MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organization_members (
  id              VARCHAR(36) NOT NULL,
  organization_id VARCHAR(36) NOT NULL,
  user_id         VARCHAR(36) NOT NULL,
  role            ENUM('owner','admin','treasurer','viewer') NOT NULL DEFAULT 'viewer',
  invited_by      VARCHAR(36) NULL,
  joined_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_org_members (organization_id, user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_org_members_user (user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUTH
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token      VARCHAR(512)    NOT NULL,
  user_id    VARCHAR(36)     NOT NULL,
  expires_at DATETIME        NOT NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_token (token(255)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token      VARCHAR(512)    NOT NULL,
  user_id    VARCHAR(36)     NOT NULL,
  used       TINYINT(1)      NOT NULL DEFAULT 0,
  expires_at DATETIME        NOT NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_password_resets_token (token(255)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATION PREFERENCES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id   VARCHAR(36) NOT NULL,
  payments  TINYINT(1)  NOT NULL DEFAULT 1,
  goals     TINYINT(1)  NOT NULL DEFAULT 1,
  reminders TINYINT(1)  NOT NULL DEFAULT 0,
  marketing TINYINT(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- GOALS / CAMPAIGNS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id              VARCHAR(36)    NOT NULL,
  user_id         VARCHAR(36)    NOT NULL,
  organization_id VARCHAR(36)    NULL,
  title           VARCHAR(255)   NOT NULL,
  description     TEXT           NULL,
  target_amount   DECIMAL(15,2)  NOT NULL,
  current_amount  DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  category        VARCHAR(100)   NOT NULL,
  status          ENUM('active','completed','paused','cancelled') NOT NULL DEFAULT 'active',
  color           VARCHAR(20)    NULL,
  deadline        DATE           NOT NULL,
  slug            VARCHAR(255)   NULL,
  allow_anonymous TINYINT(1)     NOT NULL DEFAULT 1,
  completed_at    DATETIME       NULL,
  closed_at       DATETIME       NULL,
  collection_expires_at DATETIME NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NULL     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_goals_slug (slug),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  INDEX idx_goals_user_status (user_id, status),
  INDEX idx_goals_org (organization_id),
  INDEX idx_goals_category (category)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- VIRTUAL ACCOUNTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS virtual_accounts (
  id                 VARCHAR(36)  NOT NULL,
  goal_id            VARCHAR(36)  NOT NULL,
  organization_id    VARCHAR(36)  NULL,
  provider           ENUM('nomba') NOT NULL DEFAULT 'nomba',
  provider_account_id VARCHAR(255) NOT NULL,
  account_number     VARCHAR(20)  NOT NULL,
  account_name       VARCHAR(255) NOT NULL,
  bank_name          VARCHAR(255) NOT NULL,
  provider_reference VARCHAR(255) NOT NULL,
  status             ENUM('active','inactive','pending') NOT NULL DEFAULT 'active',
  expired_at         DATETIME     NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_virtual_accounts_number (account_number),
  UNIQUE KEY uq_virtual_accounts_provider_ref (provider_reference),
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  INDEX idx_virtual_accounts_goal (goal_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- WEBHOOK EVENTS (raw ingestion — processed by payments/reconciliation)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_events (
  id                 VARCHAR(36)  NOT NULL,
  provider           ENUM('nomba') NOT NULL DEFAULT 'nomba',
  event_type         VARCHAR(100) NOT NULL,
  provider_reference VARCHAR(255) NOT NULL,
  request_id         VARCHAR(255) NULL,
  payload            JSON         NOT NULL,
  status             ENUM('received','processed','failed','duplicate') NOT NULL DEFAULT 'received',
  processed          TINYINT(1)   NOT NULL DEFAULT 0,
  processed_at       DATETIME     NULL,
  error_message      TEXT         NULL,
  received_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_webhook_events_provider_ref (provider_reference),
  UNIQUE KEY uq_webhook_events_request_id (request_id),
  INDEX idx_webhook_events_status (status),
  INDEX idx_webhook_events_processed (processed)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYOUT ACCOUNTS / WITHDRAWALS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payout_accounts (
  id              VARCHAR(36)   NOT NULL,
  user_id         VARCHAR(36)   NOT NULL,
  organization_id VARCHAR(36)   NULL,
  provider        VARCHAR(50)   NOT NULL DEFAULT 'nomba',
  bank_code       VARCHAR(50)   NOT NULL,
  bank_name       VARCHAR(255)  NULL,
  account_number  VARCHAR(20)   NOT NULL,
  account_name    VARCHAR(255)  NOT NULL,
  is_default      TINYINT(1)    NOT NULL DEFAULT 0,
  verified_at     DATETIME      NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payout_accounts_owner_number (user_id, bank_code, account_number),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  INDEX idx_payout_accounts_user (user_id),
  INDEX idx_payout_accounts_org (organization_id)
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id                  VARCHAR(36)   NOT NULL,
  goal_id             VARCHAR(36)   NOT NULL,
  organization_id     VARCHAR(36)   NULL,
  user_id             VARCHAR(36)   NOT NULL,
  payout_account_id   VARCHAR(36)   NOT NULL,
  provider            VARCHAR(50)   NOT NULL DEFAULT 'nomba',
  provider_reference  VARCHAR(255)  NULL,
  amount              DECIMAL(15,2) NOT NULL,
  fee                 DECIMAL(15,2) NULL,
  status              ENUM('pending','processing','successful','failed') NOT NULL DEFAULT 'pending',
  failure_reason      TEXT          NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at        DATETIME      NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (payout_account_id) REFERENCES payout_accounts(id) ON DELETE RESTRICT,
  INDEX idx_withdrawals_goal (goal_id),
  INDEX idx_withdrawals_user (user_id),
  INDEX idx_withdrawals_status (status)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYMENTS (verified incoming payments from provider)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                 VARCHAR(36)    NOT NULL,
  webhook_event_id   VARCHAR(36)    NULL,
  provider           ENUM('nomba') NOT NULL DEFAULT 'nomba',
  provider_reference VARCHAR(255)   NOT NULL,
  account_number     VARCHAR(20)    NOT NULL,
  amount             DECIMAL(15,2)  NOT NULL,
  currency           VARCHAR(3)     NOT NULL DEFAULT 'NGN',
  payer_name         VARCHAR(255)   NOT NULL DEFAULT 'Anonymous',
  reference          VARCHAR(255)   NOT NULL,
  status             ENUM('received','verified','rejected','duplicate') NOT NULL DEFAULT 'received',
  paid_at            DATETIME       NULL,
  verified_at        DATETIME       NULL,
  created_at         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_provider_ref (provider_reference),
  FOREIGN KEY (webhook_event_id) REFERENCES webhook_events(id) ON DELETE SET NULL,
  INDEX idx_payments_account (account_number),
  INDEX idx_payments_status (status)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RECONCILIATION RECORDS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reconciliation_records (
  id                 VARCHAR(36) NOT NULL,
  payment_id         VARCHAR(36) NOT NULL,
  webhook_event_id   VARCHAR(36) NULL,
  organization_id    VARCHAR(36) NULL,
  goal_id            VARCHAR(36) NULL,
  virtual_account_id VARCHAR(36) NULL,
  transaction_id     VARCHAR(36) NULL,
  status             ENUM('matched','unmatched','manual','failed','pending') NOT NULL DEFAULT 'pending',
  notes              TEXT        NULL,
  processed_at       DATETIME    NULL,
  created_at         DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (webhook_event_id) REFERENCES webhook_events(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL,
  FOREIGN KEY (virtual_account_id) REFERENCES virtual_accounts(id) ON DELETE SET NULL,
  INDEX idx_reconciliation_status (status),
  INDEX idx_reconciliation_goal (goal_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRANSACTIONS (immutable payment records)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                 VARCHAR(36)    NOT NULL,
  goal_id            VARCHAR(36)    NOT NULL,
  organization_id    VARCHAR(36)    NULL,
  virtual_account_id VARCHAR(36)    NOT NULL,
  payment_id         VARCHAR(36)    NULL,
  reconciliation_id  VARCHAR(36)    NULL,
  contributor_name   VARCHAR(255)   NOT NULL,
  amount             DECIMAL(15,2)  NOT NULL,
  reference          VARCHAR(255)   NOT NULL,
  provider_reference VARCHAR(255)   NOT NULL,
  status             ENUM('pending','successful','failed','duplicate','pending_review') NOT NULL DEFAULT 'pending',
  paid_at            DATETIME       NULL,
  created_at         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_transactions_provider_ref (provider_reference),
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (virtual_account_id) REFERENCES virtual_accounts(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  FOREIGN KEY (reconciliation_id) REFERENCES reconciliation_records(id) ON DELETE SET NULL,
  INDEX idx_transactions_goal_status (goal_id, status),
  INDEX idx_transactions_org (organization_id),
  INDEX idx_transactions_paid_at (paid_at)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONTRIBUTORS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contributors (
  id               VARCHAR(36)  NOT NULL,
  goal_id          VARCHAR(36)  NOT NULL,
  organization_id  VARCHAR(36)  NULL,
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255) NULL,
  phone_number     VARCHAR(20)  NULL,
  group_label      VARCHAR(255) NULL,
  expected_amount  DECIMAL(15,2) NULL,
  unique_reference VARCHAR(255) NOT NULL,
  total_contributed DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_contributors_reference (unique_reference),
  UNIQUE KEY uq_contributors_goal_email (goal_id, email),
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INVITATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id              VARCHAR(36)  NOT NULL,
  goal_id         VARCHAR(36)  NULL,
  organization_id VARCHAR(36)  NULL,
  invited_by      VARCHAR(36)  NOT NULL,
  email           VARCHAR(255) NOT NULL,
  name            VARCHAR(255) NULL,
  role            VARCHAR(50)  NULL,
  channel         VARCHAR(50)  NOT NULL DEFAULT 'email',
  token           VARCHAR(255) NULL,
  status          ENUM('sent','accepted','declined','expired') NOT NULL DEFAULT 'sent',
  message         TEXT         NULL,
  sent_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      DATETIME     NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_invitations_email (email),
  INDEX idx_invitations_status (status)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         VARCHAR(36)  NOT NULL,
  user_id    VARCHAR(36)  NOT NULL,
  type       VARCHAR(100) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  body       TEXT         NOT NULL,
  unread     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_unread (user_id, unread)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id              VARCHAR(36)  NOT NULL,
  action          VARCHAR(100) NOT NULL,
  actor_id        VARCHAR(36)  NULL,
  organization_id VARCHAR(36)  NULL,
  resource_type   VARCHAR(100) NULL,
  resource_id     VARCHAR(36)  NULL,
  metadata        JSON         NULL,
  ip_address      VARCHAR(45)  NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  INDEX idx_audit_action (action),
  INDEX idx_audit_actor (actor_id),
  INDEX idx_audit_created (created_at)
);

CREATE TABLE IF NOT EXISTS nomba_sync_runs (
  id              VARCHAR(36)   NOT NULL,
  status          ENUM('running','completed','failed') NOT NULL DEFAULT 'running',
  started_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at    DATETIME      NULL,
  nomba_count     INT           NOT NULL DEFAULT 0,
  ledger_count    INT           NOT NULL DEFAULT 0,
  matched_count   INT           NOT NULL DEFAULT 0,
  unmatched_count INT           NOT NULL DEFAULT 0,
  drift_ngn       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  details         JSON          NULL,
  error_message   TEXT          NULL,
  PRIMARY KEY (id),
  INDEX idx_nomba_sync_started (started_at)
);

SET FOREIGN_KEY_CHECKS = 1;
