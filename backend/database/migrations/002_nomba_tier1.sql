-- Tier 1 Nomba hackathon features: requestId dedup + nightly sync runs

ALTER TABLE webhook_events
  ADD COLUMN request_id VARCHAR(255) NULL AFTER provider_reference,
  ADD UNIQUE KEY uq_webhook_events_request_id (request_id);

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
