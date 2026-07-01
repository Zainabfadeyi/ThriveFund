import { query, execute } from '../../config/database';

export const contributorsRepository = {
  async findAllByUser(userId: string) {
    return query(
      `SELECT c.id, c.name, c.email, c.group_label, c.expected_amount,
              COUNT(DISTINCT t.goal_id) AS goals_count,
              COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.amount ELSE 0 END), 0) AS total_contributed,
              MAX(t.paid_at) AS last_contribution_at,
              CASE
                WHEN c.expected_amount IS NULL THEN 'not_set'
                WHEN COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.amount ELSE 0 END), 0) = 0 THEN 'unpaid'
                WHEN COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.amount ELSE 0 END), 0) < c.expected_amount THEN 'partial'
                WHEN COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.amount ELSE 0 END), 0) = c.expected_amount THEN 'paid'
                ELSE 'overpaid'
              END AS payment_status,
              CONCAT(
                LEFT(SUBSTRING_INDEX(c.name, ' ', 1), 1),
                LEFT(SUBSTRING_INDEX(c.name, ' ', -1), 1)
              ) AS avatar_initials
       FROM contributors c
       JOIN goals g ON g.id = c.goal_id
       LEFT JOIN transactions t ON t.contributor_name = c.name AND t.goal_id = c.goal_id
       WHERE g.user_id = ?
       GROUP BY c.id, c.name, c.email, c.group_label, c.expected_amount
       ORDER BY total_contributed DESC`,
      [userId],
    );
  },

  async findByGoal(goalId: string) {
    return query(
      `SELECT c.id, c.name, c.email, c.phone_number, c.group_label, c.expected_amount,
              COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.amount ELSE 0 END), 0) AS total_contributed,
              MAX(t.paid_at) AS last_contribution_at,
              CASE
                WHEN c.expected_amount IS NULL THEN 'not_set'
                WHEN COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.amount ELSE 0 END), 0) = 0 THEN 'unpaid'
                WHEN COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.amount ELSE 0 END), 0) < c.expected_amount THEN 'partial'
                WHEN COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.amount ELSE 0 END), 0) = c.expected_amount THEN 'paid'
                ELSE 'overpaid'
              END AS payment_status
       FROM contributors c
       LEFT JOIN transactions t ON t.contributor_name = c.name AND t.goal_id = c.goal_id
       WHERE c.goal_id = ?
       GROUP BY c.id, c.name, c.email, c.phone_number, c.group_label, c.expected_amount
       ORDER BY total_contributed DESC`,
      [goalId],
    );
  },

  async insert(data: {
    id: string;
    goal_id: string;
    name: string;
    email?: string | null;
    phone_number?: string | null;
    group_label?: string | null;
    expected_amount?: number | null;
    unique_reference: string;
  }) {
    await execute(
      `INSERT INTO contributors
         (id, goal_id, name, email, phone_number, group_label, expected_amount, unique_reference, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        data.id, data.goal_id, data.name, data.email ?? null, data.phone_number ?? null,
        data.group_label ?? null, data.expected_amount ?? null, data.unique_reference,
      ],
    );
    const rows = await query('SELECT * FROM contributors WHERE id = ?', [data.id]);
    return rows[0];
  },

  async upsertExpectedPayer(data: {
    id: string;
    goal_id: string;
    organization_id?: string | null;
    name: string;
    email: string;
    phone_number?: string | null;
    group_label?: string | null;
    expected_amount?: number | null;
    unique_reference: string;
  }) {
    await execute(
      `INSERT INTO contributors
         (id, goal_id, organization_id, name, email, phone_number, group_label, expected_amount, unique_reference, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         phone_number = COALESCE(VALUES(phone_number), phone_number),
         group_label = COALESCE(VALUES(group_label), group_label),
         expected_amount = COALESCE(VALUES(expected_amount), expected_amount)`,
      [
        data.id, data.goal_id, data.organization_id ?? null, data.name, data.email,
        data.phone_number ?? null, data.group_label ?? null, data.expected_amount ?? null,
        data.unique_reference,
      ],
    );

    const rows = await query('SELECT * FROM contributors WHERE goal_id = ? AND email = ?', [data.goal_id, data.email]);
    return rows[0];
  },

  async outstandingSummary(goalId: string) {
    const rows = await query(
      `SELECT
         COUNT(*) AS total_payers,
         COALESCE(SUM(expected_amount), 0) AS total_expected,
         COALESCE(SUM(total_paid), 0) AS total_collected,
         COALESCE(SUM(GREATEST(COALESCE(expected_amount, 0) - total_paid, 0)), 0) AS outstanding_amount,
         SUM(CASE WHEN expected_amount IS NOT NULL AND total_paid = 0 THEN 1 ELSE 0 END) AS unpaid_count,
         SUM(CASE WHEN expected_amount IS NOT NULL AND total_paid > 0 AND total_paid < expected_amount THEN 1 ELSE 0 END) AS partial_count,
         SUM(CASE WHEN expected_amount IS NOT NULL AND total_paid >= expected_amount THEN 1 ELSE 0 END) AS paid_count,
         SUM(CASE WHEN expected_amount IS NOT NULL AND total_paid > expected_amount THEN 1 ELSE 0 END) AS overpaid_count
       FROM (
         SELECT c.id, c.expected_amount,
                COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.amount ELSE 0 END), 0) AS total_paid
         FROM contributors c
         LEFT JOIN transactions t ON t.contributor_name = c.name AND t.goal_id = c.goal_id
         WHERE c.goal_id = ?
         GROUP BY c.id, c.expected_amount
       ) payer_totals`,
      [goalId],
    );
    return rows[0];
  },

  async findOutstandingWithEmail(goalId: string) {
    return query(
      `SELECT *
       FROM (
         SELECT c.id, c.name, c.email, c.expected_amount,
                COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.amount ELSE 0 END), 0) AS total_contributed
         FROM contributors c
         LEFT JOIN transactions t ON t.contributor_name = c.name AND t.goal_id = c.goal_id
         WHERE c.goal_id = ? AND c.email IS NOT NULL AND c.expected_amount IS NOT NULL
         GROUP BY c.id, c.name, c.email, c.expected_amount
       ) rows_with_totals
       WHERE total_contributed < expected_amount`,
      [goalId],
    );
  },

  async insertInvitation(data: {
    id: string;
    goal_id: string;
    email: string;
    name?: string | null;
    channel: string;
  }) {
    await execute(
      `INSERT INTO invitations (id, goal_id, email, name, channel, status, sent_at)
       VALUES (?, ?, ?, ?, ?, 'sent', NOW())`,
      [data.id, data.goal_id, data.email, data.name ?? null, data.channel],
    );
    const rows = await query('SELECT * FROM invitations WHERE id = ?', [data.id]);
    return rows[0];
  },

  async findInvitationsByGoal(goalId: string) {
    return query(
      'SELECT * FROM invitations WHERE goal_id = ? ORDER BY sent_at DESC',
      [goalId],
    );
  },
};
