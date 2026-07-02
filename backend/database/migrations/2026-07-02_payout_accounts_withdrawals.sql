-- Adds saved payout accounts and campaign withdrawal records.

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
  KEY idx_payout_accounts_user (user_id),
  KEY idx_payout_accounts_org (organization_id),
  CONSTRAINT fk_payout_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_payout_accounts_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
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
  KEY idx_withdrawals_goal (goal_id),
  KEY idx_withdrawals_user (user_id),
  KEY idx_withdrawals_status (status),
  CONSTRAINT fk_withdrawals_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE RESTRICT,
  CONSTRAINT fk_withdrawals_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  CONSTRAINT fk_withdrawals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_withdrawals_payout_account FOREIGN KEY (payout_account_id) REFERENCES payout_accounts(id) ON DELETE RESTRICT
);
