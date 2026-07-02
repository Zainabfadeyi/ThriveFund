import { execute, query } from '../../config/database';

export const withdrawalsRepository = {
  async sumReservedByGoal(goalId: string) {
    const rows = await query<{ total: number | string | null }>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM withdrawals
       WHERE goal_id = ? AND status IN ('pending', 'processing', 'successful')`,
      [goalId],
    );
    return Number(rows[0]?.total ?? 0);
  },

  async findByGoal(goalId: string, userId: string) {
    return query(
      `SELECT w.*, pa.bank_name, pa.account_number, pa.account_name, g.title AS goal_title
       FROM withdrawals w
       JOIN goals g ON g.id = w.goal_id
       JOIN payout_accounts pa ON pa.id = w.payout_account_id
       WHERE w.goal_id = ? AND w.user_id = ? AND g.user_id = ?
       ORDER BY w.created_at DESC`,
      [goalId, userId, userId],
    );
  },

  async findByUser(userId: string, filters: { goal_id?: string; status?: string; page: number; perPage: number }) {
    const conditions = ['w.user_id = ?'];
    const values: unknown[] = [userId];
    if (filters.goal_id) { conditions.push('w.goal_id = ?'); values.push(filters.goal_id); }
    if (filters.status) { conditions.push('w.status = ?'); values.push(filters.status); }
    const where = conditions.join(' AND ');
    const countRows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM withdrawals w WHERE ${where}`,
      values,
    );
    const rows = await query(
      `SELECT w.*, pa.bank_name, pa.account_number, pa.account_name, g.title AS goal_title
       FROM withdrawals w
       JOIN payout_accounts pa ON pa.id = w.payout_account_id
       JOIN goals g ON g.id = w.goal_id
       WHERE ${where}
       ORDER BY w.created_at DESC LIMIT ? OFFSET ?`,
      [...values, filters.perPage, (filters.page - 1) * filters.perPage],
    );
    return { rows, total: Number(countRows[0].total) };
  },

  async insert(data: {
    id: string;
    goal_id: string;
    organization_id?: string | null;
    user_id: string;
    payout_account_id: string;
    provider: string;
    amount: number;
  }) {
    await execute(
      `INSERT INTO withdrawals
         (id, goal_id, organization_id, user_id, payout_account_id, provider, amount, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        data.id,
        data.goal_id,
        data.organization_id ?? null,
        data.user_id,
        data.payout_account_id,
        data.provider,
        data.amount,
      ],
    );
    return this.findById(data.id);
  },

  async markProcessing(id: string, providerReference: string, fee?: number) {
    await execute(
      `UPDATE withdrawals
       SET status = 'processing', provider_reference = ?, fee = ?, processed_at = NOW()
       WHERE id = ?`,
      [providerReference, fee ?? null, id],
    );
    return this.findById(id);
  },

  async markSuccessful(id: string, providerReference: string, fee?: number) {
    await execute(
      `UPDATE withdrawals
       SET status = 'successful', provider_reference = ?, fee = ?, processed_at = NOW()
       WHERE id = ?`,
      [providerReference, fee ?? null, id],
    );
    return this.findById(id);
  },

  async markFailed(id: string, reason: string, providerReference?: string, fee?: number) {
    await execute(
      `UPDATE withdrawals
       SET status = 'failed', failure_reason = ?, provider_reference = ?, fee = ?, processed_at = NOW()
       WHERE id = ?`,
      [reason, providerReference ?? null, fee ?? null, id],
    );
    return this.findById(id);
  },

  async findById(id: string) {
    const rows = await query(
      `SELECT w.*, pa.bank_name, pa.account_number, pa.account_name, g.title AS goal_title
       FROM withdrawals w
       JOIN payout_accounts pa ON pa.id = w.payout_account_id
       JOIN goals g ON g.id = w.goal_id
       WHERE w.id = ?
       LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  },

  async findByProviderReference(providerReference: string) {
    const rows = await query(
      `SELECT w.*, pa.bank_name, pa.account_number, pa.account_name, g.title AS goal_title
       FROM withdrawals w
       JOIN payout_accounts pa ON pa.id = w.payout_account_id
       JOIN goals g ON g.id = w.goal_id
       WHERE w.provider_reference = ?
       LIMIT 1`,
      [providerReference],
    );
    return rows[0] ?? null;
  },

  async findOpenByMerchantTxRef(merchantTxRef: string) {
    const withdrawalId = withdrawalIdFromMerchantTxRef(merchantTxRef);
    if (!withdrawalId) return null;

    const rows = await query(
      `SELECT w.*, pa.bank_name, pa.account_number, pa.account_name, g.title AS goal_title
       FROM withdrawals w
       JOIN payout_accounts pa ON pa.id = w.payout_account_id
       JOIN goals g ON g.id = w.goal_id
       WHERE w.id = ? AND w.status IN ('pending', 'processing', 'failed')
       LIMIT 1`,
      [withdrawalId],
    );
    return rows[0] ?? null;
  },
};

function withdrawalIdFromMerchantTxRef(merchantTxRef: string): string | null {
  if (!merchantTxRef.startsWith('TF-WD-')) return null;
  const suffix = merchantTxRef.slice('TF-WD-'.length);
  if (!suffix.startsWith('wd') || suffix.length < 14) return null;
  return `wd_${suffix.slice(2)}`;
}
