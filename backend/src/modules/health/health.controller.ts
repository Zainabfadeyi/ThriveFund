import type { Request, Response } from 'express';
import { checkDbConnection } from '../../config/database';
import { env } from '../../config/env';
import { getPaymentProvider } from '../../providers/payment';
import { nombaSyncService } from '../nomba-sync/nomba-sync.service';

export const healthController = {
  liveness(_req: Request, res: Response) {
    res.json({ status: 'ok' });
  },

  async readiness(_req: Request, res: Response) {
    const dbOk = await checkDbConnection();
    const provider = getPaymentProvider();
    const providerHealth = await provider.healthCheck();
    const syncHealth = await nombaSyncService.platformHealth().catch(() => ({
      last_reconciliation: null,
      ledger_drift_ngn: 0,
      last_sync_status: null,
      failed_webhooks_24h: 0,
    }));

    const nombaOk = providerHealth.status === 'ok';
    const status = dbOk && nombaOk ? 'ready' : 'degraded';

    res.status(dbOk && nombaOk ? 200 : 503).json({
      status,
      checks: {
        database: dbOk ? 'ok' : 'error',
        nomba_api: providerHealth.status,
        nomba_api_message: providerHealth.message,
        webhook_secret_configured: Boolean(env.NOMBA_WEBHOOK_SECRET),
        last_reconciliation: syncHealth.last_reconciliation,
        ledger_drift_ngn: syncHealth.ledger_drift_ngn,
        last_sync_status: syncHealth.last_sync_status,
        failed_webhooks_24h: syncHealth.failed_webhooks_24h,
        payment_provider: providerHealth.status,
        payment_provider_message: providerHealth.message,
      },
    });
  },
};
