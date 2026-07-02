import { v4 as uuid } from 'uuid';
import { query, execute } from '../../config/database';
import { getPaymentProvider } from '../../providers/payment';
import { logAudit } from '../../lib/audit';
import { AuditAction } from '../../shared/types/enums';
import { transactionsRepository } from '../transactions/transactions.repository';

export const nombaSyncRepository = {
  async insertRun(data: {
    id: string;
    status: 'running' | 'completed' | 'failed';
  }) {
    await execute(
      `INSERT INTO nomba_sync_runs (id, status, started_at) VALUES (?, ?, NOW())`,
      [data.id, data.status],
    );
    return this.findById(data.id);
  },

  async completeRun(id: string, data: {
    status: 'completed' | 'failed';
    nomba_count: number;
    ledger_count: number;
    matched_count: number;
    unmatched_count: number;
    drift_ngn: number;
    details?: unknown;
    error_message?: string;
  }) {
    await execute(
      `UPDATE nomba_sync_runs
       SET status = ?, completed_at = NOW(), nomba_count = ?, ledger_count = ?, matched_count = ?,
           unmatched_count = ?, drift_ngn = ?, details = ?, error_message = ?
       WHERE id = ?`,
      [
        data.status,
        data.nomba_count,
        data.ledger_count,
        data.matched_count,
        data.unmatched_count,
        data.drift_ngn,
        data.details ? JSON.stringify(data.details) : null,
        data.error_message ?? null,
        id,
      ],
    );
    return this.findById(id);
  },

  async findById(id: string) {
    const rows = await query('SELECT * FROM nomba_sync_runs WHERE id = ?', [id]);
    return rows[0] ?? null;
  },

  async findLatest() {
    const rows = await query('SELECT * FROM nomba_sync_runs ORDER BY started_at DESC LIMIT 1');
    return rows[0] ?? null;
  },

  async listRecent(limit = 10) {
    return query(
      `SELECT id, status, started_at, completed_at, nomba_count, ledger_count, matched_count,
              unmatched_count, drift_ngn, error_message
       FROM nomba_sync_runs ORDER BY started_at DESC LIMIT ?`,
      [limit],
    );
  },

  async countFailedWebhooks24h() {
    const rows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM webhook_events
       WHERE status = 'failed' AND received_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    );
    return Number(rows[0]?.total ?? 0);
  },
};

export const nombaSyncService = {
  async runSync(options: { dateFrom?: string } = {}) {
    const runId = `sync_${uuid().replace(/-/g, '').slice(0, 12)}`;
    await nombaSyncRepository.insertRun({ id: runId, status: 'running' });

    try {
      const provider = getPaymentProvider();
      const dateFrom = options.dateFrom ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const nombaRows: Array<{
        providerReference: string;
        merchantTxRef?: string;
        amountNaira: number;
        status: string;
      }> = [];

      let cursor: string | undefined;
      do {
        const page = await provider.listBankTransactions({ dateFrom, limit: 50, cursor });
        nombaRows.push(...page.rows.filter((row) => row.status.toUpperCase() === 'SUCCESS'));
        cursor = page.cursor;
      } while (cursor && nombaRows.length < 500);

      const ledgerRows = await transactionsRepository.findSuccessfulSince(dateFrom);
      const ledgerByRef = new Map(
        ledgerRows.map((row) => [row.provider_reference as string, row]),
      );

      const unmatchedNomba: typeof nombaRows = [];
      let matchedCount = 0;
      let driftNgn = 0;

      for (const nombaTxn of nombaRows) {
        const ledgerTxn = ledgerByRef.get(nombaTxn.providerReference);
        if (!ledgerTxn) {
          unmatchedNomba.push(nombaTxn);
          driftNgn += nombaTxn.amountNaira;
          continue;
        }
        matchedCount += 1;
        const ledgerAmount = Number(ledgerTxn.amount);
        if (Math.abs(ledgerAmount - nombaTxn.amountNaira) > 0.01) {
          driftNgn += Math.abs(ledgerAmount - nombaTxn.amountNaira);
        }
        ledgerByRef.delete(nombaTxn.providerReference);
      }

      const unmatchedLedger = [...ledgerByRef.values()].map((row) => ({
        provider_reference: row.provider_reference,
        amount: Number(row.amount),
        goal_id: row.goal_id,
      }));

      for (const row of unmatchedLedger) {
        driftNgn += Number(row.amount);
      }

      const unmatchedCount = unmatchedNomba.length + unmatchedLedger.length;
      const details = {
        unmatched_nomba: unmatchedNomba.slice(0, 20),
        unmatched_ledger: unmatchedLedger.slice(0, 20),
        date_from: dateFrom,
      };

      const run = await nombaSyncRepository.completeRun(runId, {
        status: 'completed',
        nomba_count: nombaRows.length,
        ledger_count: ledgerRows.length,
        matched_count: matchedCount,
        unmatched_count: unmatchedCount,
        drift_ngn: driftNgn,
        details,
      });

      await logAudit({
        action: AuditAction.NombaSyncCompleted,
        resource_type: 'nomba_sync_run',
        resource_id: runId,
        metadata: {
          matched_count: matchedCount,
          unmatched_count: unmatchedCount,
          drift_ngn: driftNgn,
        },
      });

      return run;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nomba sync failed';
      await nombaSyncRepository.completeRun(runId, {
        status: 'failed',
        nomba_count: 0,
        ledger_count: 0,
        matched_count: 0,
        unmatched_count: 0,
        drift_ngn: 0,
        error_message: message,
      });
      throw err;
    }
  },

  async latest() {
    return nombaSyncRepository.findLatest();
  },

  async listRecent(limit = 10) {
    return nombaSyncRepository.listRecent(limit);
  },

  async platformHealth() {
    const latest = await nombaSyncRepository.findLatest();
    const failedWebhooks24h = await nombaSyncRepository.countFailedWebhooks24h();
    return {
      last_reconciliation: latest?.completed_at ?? latest?.started_at ?? null,
      ledger_drift_ngn: Number(latest?.drift_ngn ?? 0),
      last_sync_status: latest?.status ?? null,
      failed_webhooks_24h: failedWebhooks24h,
    };
  },
};
