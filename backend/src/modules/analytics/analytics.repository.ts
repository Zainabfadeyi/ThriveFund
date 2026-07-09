import { query } from '../../config/database';

export const analyticsRepository = {
  async getOverview(userId: string) {
    const rows = await query(
      `SELECT
         (SELECT COALESCE(SUM(current_amount), 0) FROM goals WHERE user_id = ?) AS total_saved,
         (SELECT COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) FROM goals WHERE user_id = ?) AS active_goals,
         (SELECT COALESCE(COUNT(DISTINCT LOWER(TRIM(contributor_name))), 0)
          FROM transactions t
          JOIN goals g ON g.id = t.goal_id
          WHERE g.user_id = ? AND t.status = 'successful') AS contributors_count,
         (SELECT COALESCE(SUM(t.amount), 0)
          FROM transactions t
          JOIN goals g ON g.id = t.goal_id
          WHERE g.user_id = ?
            AND t.status = 'successful'
            AND DATE_FORMAT(t.paid_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')) AS this_month_amount`,
      [userId, userId, userId, userId],
    );
    return rows[0];
  },

  async getRecentTransactions(userId: string, limit = 5) {
    return query(
      `SELECT t.id, t.contributor_name, t.amount, t.status, t.paid_at, g.title AS goal_title
       FROM transactions t JOIN goals g ON g.id = t.goal_id
       WHERE g.user_id = ?
       ORDER BY t.paid_at DESC LIMIT ?`,
      [userId, limit],
    );
  },

  async getRecentGoals(userId: string, limit = 5) {
    return query(
      `SELECT id, title, target_amount, current_amount, status,
              ROUND((current_amount / NULLIF(target_amount, 0)) * 100) AS progress_percent
       FROM goals WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ?`,
      [userId, limit],
    );
  },

  async getMonthlyContributions(userId: string, months: number) {
    // Compute the cutoff date in JS — MySQL doesn't support dynamic INTERVAL multiplier in prepared statements
    const from = new Date();
    from.setMonth(from.getMonth() - months);
    const fromStr = from.toISOString().slice(0, 10);

    return query(
      `SELECT DATE_FORMAT(t.paid_at, '%Y-%m') AS month,
              COALESCE(SUM(t.amount), 0) AS amount
       FROM transactions t JOIN goals g ON g.id = t.goal_id
       WHERE g.user_id = ?
         AND t.status = 'successful'
         AND t.paid_at >= ?
       GROUP BY month
       ORDER BY month`,
      [userId, fromStr],
    );
  },

  async getCategoryBreakdown(userId: string) {
    return query(
      `SELECT g.category,
              COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.amount ELSE 0 END), 0) AS total,
              COUNT(DISTINCT g.id) AS goals_count
       FROM goals g
       LEFT JOIN transactions t ON t.goal_id = g.id
       WHERE g.user_id = ?
       GROUP BY g.category
       ORDER BY total DESC`,
      [userId],
    );
  },

  async getTopContributors(userId: string, limit: number) {
    return query(
      `SELECT MIN(TRIM(t.contributor_name)) AS contributor_name,
              COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.amount ELSE 0 END), 0) AS total,
              COUNT(*) AS transaction_count
       FROM transactions t JOIN goals g ON g.id = t.goal_id
       WHERE g.user_id = ? AND t.status = 'successful'
       GROUP BY LOWER(TRIM(t.contributor_name))
       ORDER BY total DESC
       LIMIT ?`,
      [userId, limit],
    );
  },

  async getGoalPerformance(userId: string) {
    return query(
      `SELECT id, title, target_amount, current_amount, status,
              ROUND((current_amount / NULLIF(target_amount, 0)) * 100) AS progress_percent,
              GREATEST(0, DATEDIFF(deadline, NOW())) AS days_left
       FROM goals WHERE user_id = ?
       ORDER BY progress_percent DESC`,
      [userId],
    );
  },
};
