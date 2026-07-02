import { query } from '../../config/database';

export const adminRepository = {
  async getPlatformStats() {
    const rows = await query(
      `SELECT
         (SELECT COUNT(*) FROM users)                                                            AS total_users,
         (SELECT COUNT(*) FROM goals)                                                            AS total_goals,
         (SELECT COUNT(*) FROM transactions)                                                     AS total_transactions,
         (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'successful')        AS total_volume_ngn,
         (SELECT COUNT(*) FROM webhook_events WHERE processed = 0)                              AS pending_reconciliation,
         (SELECT COUNT(*) FROM webhook_events
            WHERE processed = 0 AND received_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR))           AS failed_webhooks_24h`,
    );
    return rows[0];
  },

  async listUsers(page: number, perPage: number) {
    return query(
      `SELECT id, full_name, email, role, created_at
       FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [perPage, (page - 1) * perPage],
    );
  },

  async listGoals(page: number, perPage: number) {
    return query(
      `SELECT g.id, g.title, g.category, g.target_amount, g.current_amount, g.status,
              u.email AS owner_email
       FROM goals g JOIN users u ON u.id = g.user_id
       ORDER BY g.created_at DESC LIMIT ? OFFSET ?`,
      [perPage, (page - 1) * perPage],
    );
  },

  async listOrganizations(filters: { q?: string; type?: string; page: number; perPage: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (filters.q) {
      conditions.push('(o.name LIKE ? OR o.email LIKE ? OR u.email LIKE ?)');
      values.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
    }
    if (filters.type) {
      conditions.push('o.type = ?');
      values.push(filters.type);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM organizations o JOIN users u ON u.id = o.owner_id ${where}`,
      values,
    );
    const rows = await query(
      `SELECT o.*, u.email AS owner_email, u.full_name AS owner_name,
              COALESCE(gt.campaigns_count, 0) AS campaigns_count,
              COALESCE(gt.total_collected, 0) AS total_collected,
              COALESCE(gt.total_target, 0) AS total_target
       FROM organizations o
       JOIN users u ON u.id = o.owner_id
       LEFT JOIN (
         SELECT organization_id,
                COUNT(*) AS campaigns_count,
                COALESCE(SUM(current_amount), 0) AS total_collected,
                COALESCE(SUM(target_amount), 0) AS total_target
         FROM goals
         GROUP BY organization_id
       ) gt ON gt.organization_id = o.id
       ${where}
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...values, filters.perPage, (filters.page - 1) * filters.perPage],
    );
    return { rows, total: Number(countRows[0].total) };
  },

  async getOrganizationDetail(id: string) {
    const rows = await query(
      `SELECT o.*, u.email AS owner_email, u.full_name AS owner_name,
              COALESCE(gt.campaigns_count, 0) AS campaigns_count,
              COALESCE(gt.total_collected, 0) AS total_collected,
              COALESCE(gt.total_target, 0) AS total_target
       FROM organizations o
       JOIN users u ON u.id = o.owner_id
       LEFT JOIN (
         SELECT organization_id,
                COUNT(*) AS campaigns_count,
                COALESCE(SUM(current_amount), 0) AS total_collected,
                COALESCE(SUM(target_amount), 0) AS total_target
         FROM goals
         GROUP BY organization_id
       ) gt ON gt.organization_id = o.id
       WHERE o.id = ?
       LIMIT 1`,
      [id],
    );
    if (!rows[0]) return null;
    const [campaigns, transactions] = await Promise.all([
      query(
        `SELECT id, title, target_amount, current_amount, status, category, deadline, created_at
         FROM goals WHERE organization_id = ? ORDER BY created_at DESC LIMIT 20`,
        [id],
      ),
      query(
        `SELECT t.id, t.contributor_name, t.amount, t.status, t.paid_at, g.title AS goal_title
         FROM transactions t
         JOIN goals g ON g.id = t.goal_id
         WHERE g.organization_id = ?
         ORDER BY t.paid_at DESC LIMIT 20`,
        [id],
      ),
    ]);
    return { ...rows[0], campaigns, recent_transactions: transactions };
  },

  async updateOrganization(id: string, fields: Record<string, unknown>) {
    const allowed = ['name', 'type', 'description', 'email', 'phone', 'address'];
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (sets.length) {
      values.push(id);
      await query(`UPDATE organizations SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
    }
    return this.getOrganizationDetail(id);
  },

  async listGoalsEnhanced(filters: {
    page: number;
    perPage: number;
    organization_id?: string;
    status?: string;
    q?: string;
  }) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (filters.organization_id) { conditions.push('g.organization_id = ?'); values.push(filters.organization_id); }
    if (filters.status) { conditions.push('g.status = ?'); values.push(filters.status); }
    if (filters.q) { conditions.push('(g.title LIKE ? OR o.name LIKE ? OR u.email LIKE ?)'); values.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM goals g
       JOIN users u ON u.id = g.user_id
       LEFT JOIN organizations o ON o.id = g.organization_id ${where}`,
      values,
    );
    const rows = await query(
      `SELECT g.id, g.title, g.category, g.target_amount, g.current_amount, g.status,
              g.completed_at, g.closed_at, o.name AS organization_name, u.email AS owner_email
       FROM goals g
       JOIN users u ON u.id = g.user_id
       LEFT JOIN organizations o ON o.id = g.organization_id
       ${where}
       ORDER BY g.created_at DESC LIMIT ? OFFSET ?`,
      [...values, filters.perPage, (filters.page - 1) * filters.perPage],
    );
    return { rows, total: Number(countRows[0].total) };
  },

  async updateGoalStatus(goalId: string, status: string) {
    await query(
      `UPDATE goals SET status = ?, completed_at = IF(? = 'completed', COALESCE(completed_at, NOW()), completed_at), updated_at = NOW()
       WHERE id = ?`,
      [status, status, goalId],
    );
    const rows = await query('SELECT * FROM goals WHERE id = ?', [goalId]);
    return rows[0] ?? null;
  },

  async listTransactions(page: number, perPage: number) {
    return query(
      `SELECT t.id, t.reference, t.amount, t.status, t.paid_at,
              g.title AS goal_title, u.email AS owner_email
       FROM transactions t
       JOIN goals g ON g.id = t.goal_id
       JOIN users u ON u.id = g.user_id
       ORDER BY t.paid_at DESC LIMIT ? OFFSET ?`,
      [perPage, (page - 1) * perPage],
    );
  },
};
