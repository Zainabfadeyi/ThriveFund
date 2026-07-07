import { query } from '../../config/database';
import { parsePagination, buildMeta } from '../../shared/utils/pagination';

export const reportsRepository = {
  async financialSummary(userId: string) {
    const rows = await query(
      `SELECT
         (SELECT COUNT(*) FROM goals WHERE user_id = ?) AS total_goals,
         (SELECT COUNT(*) FROM goals WHERE user_id = ? AND status = 'active') AS active_goals,
         (SELECT COALESCE(SUM(current_amount), 0) FROM goals WHERE user_id = ?) AS total_collected,
         (SELECT COALESCE(SUM(target_amount), 0) FROM goals WHERE user_id = ?) AS total_target,
         (SELECT COUNT(*) FROM transactions t JOIN goals g ON g.id = t.goal_id
          WHERE g.user_id = ? AND t.status = 'successful') AS total_transactions,
         (SELECT COUNT(*) FROM contributors c JOIN goals g ON g.id = c.goal_id
          WHERE g.user_id = ?) AS total_contributors`,
      [userId, userId, userId, userId, userId, userId],
    );
    return rows[0];
  },

  async transactionsReport(userId: string, filters: { from?: string; to?: string; goal_id?: string }) {
    const conditions = ['g.user_id = ?', "t.status = 'successful'"];
    const values: unknown[] = [userId];
    if (filters.goal_id) { conditions.push('t.goal_id = ?'); values.push(filters.goal_id); }
    if (filters.from) { conditions.push('t.paid_at >= ?'); values.push(filters.from); }
    if (filters.to) { conditions.push('t.paid_at <= ?'); values.push(filters.to); }

    return query(
      `SELECT t.reference, g.title AS goal, t.contributor_name, t.amount, t.status, t.paid_at
       FROM transactions t JOIN goals g ON g.id = t.goal_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY t.paid_at DESC`,
      values,
    );
  },

  async reconciliationReport(userId: string, page: number, perPage: number) {
    const offset = (page - 1) * perPage;
    const countRows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM reconciliation_records rr
       JOIN goals g ON g.id = rr.goal_id WHERE g.user_id = ?`,
      [userId],
    );
    const rows = await query(
      `SELECT rr.id, rr.status, p.amount, p.payer_name, g.title AS goal_title, rr.processed_at
       FROM reconciliation_records rr
       JOIN payments p ON p.id = rr.payment_id
       LEFT JOIN goals g ON g.id = rr.goal_id
       WHERE g.user_id = ?
       ORDER BY rr.created_at DESC LIMIT ? OFFSET ?`,
      [userId, perPage, offset],
    );
    return { rows, total: Number(countRows[0].total) };
  },
};
