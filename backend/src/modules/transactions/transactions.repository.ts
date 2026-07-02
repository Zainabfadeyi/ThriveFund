import { query, execute } from '../../config/database';

interface ListFilters {
  goal_id?: string;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
  page: number;
  perPage: number;
}

export const transactionsRepository = {
  async findAll(userId: string, filters: ListFilters) {
    const conditions = ['g.user_id = ?'];
    const values: unknown[] = [userId];

    if (filters.goal_id) { conditions.push('t.goal_id = ?');              values.push(filters.goal_id); }
    if (filters.status)  { conditions.push('t.status = ?');               values.push(filters.status); }
    if (filters.from)    { conditions.push('t.paid_at >= ?');             values.push(filters.from); }
    if (filters.to)      { conditions.push('t.paid_at <= ?');             values.push(filters.to); }
    if (filters.q) {
      conditions.push('(t.contributor_name LIKE ? OR t.reference LIKE ? OR t.provider_reference LIKE ?)');
      values.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
    }

    const where = conditions.join(' AND ');
    const countRows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM transactions t JOIN goals g ON g.id = t.goal_id WHERE ${where}`,
      values,
    );

    const rows = await query(
      `SELECT t.id, t.reference, t.provider_reference, t.goal_id, g.title AS goal_title,
              t.contributor_name, t.amount, t.status, t.paid_at
       FROM transactions t JOIN goals g ON g.id = t.goal_id
       WHERE ${where}
       ORDER BY t.paid_at DESC LIMIT ? OFFSET ?`,
      [...values, filters.perPage, (filters.page - 1) * filters.perPage],
    );

    return { rows, total: Number(countRows[0].total) };
  },

  async findById(txnId: string, userId: string) {
    const rows = await query(
      `SELECT t.* FROM transactions t
       JOIN goals g ON g.id = t.goal_id
       WHERE t.id = ? AND g.user_id = ?`,
      [txnId, userId],
    );
    return rows[0] ?? null;
  },

  async findByProviderReference(providerReference: string) {
    const rows = await query(
      'SELECT id FROM transactions WHERE provider_reference = ?',
      [providerReference],
    );
    return rows[0] ?? null;
  },

  async countPendingByGoal(goalId: string): Promise<number> {
    const rows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM transactions WHERE goal_id = ? AND status = 'pending'`,
      [goalId],
    );
    return Number(rows[0].total);
  },

  async insert(data: {
    id: string;
    goal_id: string;
    virtual_account_id: string;
    contributor_name: string;
    amount: number;
    reference: string;
    provider_reference: string;
    status: string;
    paid_at: string;
    organization_id?: string | null;
    payment_id?: string;
    reconciliation_id?: string;
  }) {
    await execute(
      `INSERT INTO transactions
         (id, goal_id, organization_id, virtual_account_id, payment_id, reconciliation_id,
          contributor_name, amount, reference, provider_reference, status, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.id, data.goal_id, data.organization_id ?? null, data.virtual_account_id,
       data.payment_id ?? null, data.reconciliation_id ?? null,
       data.contributor_name, data.amount, data.reference, data.provider_reference,
       data.status, data.paid_at],
    );
  },

  async findForExport(userId: string, filters: { goal_id?: string; from?: string; to?: string; status?: string }) {
    const conditions = ['g.user_id = ?'];
    const values: unknown[] = [userId];

    if (filters.goal_id) { conditions.push('t.goal_id = ?'); values.push(filters.goal_id); }
    if (filters.status)  { conditions.push('t.status = ?');  values.push(filters.status); }
    if (filters.from)    { conditions.push('t.paid_at >= ?'); values.push(filters.from); }
    if (filters.to)      { conditions.push('t.paid_at <= ?'); values.push(filters.to); }

    return query(
      `SELECT t.reference, g.title AS goal, t.contributor_name, t.amount, t.status, t.paid_at
       FROM transactions t JOIN goals g ON g.id = t.goal_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY t.paid_at DESC`,
      values,
    );
  },
};
