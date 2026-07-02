import { query, execute } from '../../config/database';

export const virtualAccountsRepository = {
  async findActiveByGoalId(goalId: string) {
    const rows = await query(
      `SELECT * FROM virtual_accounts WHERE goal_id = ? AND status = 'active'`,
      [goalId],
    );
    return rows[0] ?? null;
  },

  async findByGoalId(goalId: string) {
    const rows = await query(
      `SELECT * FROM virtual_accounts WHERE goal_id = ? AND status = 'active' LIMIT 1`,
      [goalId],
    );
    return rows[0] ?? null;
  },

  async insert(data: {
    id: string;
    goal_id: string;
    organization_id?: string | null;
    provider: string;
    provider_account_id: string;
    account_number: string;
    account_name: string;
    bank_name: string;
    provider_reference: string;
  }) {
    await execute(
      `INSERT INTO virtual_accounts
         (id, goal_id, organization_id, provider, provider_account_id, account_number,
          account_name, bank_name, provider_reference, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [data.id, data.goal_id, data.organization_id ?? null, data.provider,
       data.provider_account_id, data.account_number, data.account_name,
       data.bank_name, data.provider_reference],
    );
    const rows = await query('SELECT * FROM virtual_accounts WHERE id = ?', [data.id]);
    return rows[0];
  },

  async findByGoalAndUser(goalId: string, userId: string) {
    const rows = await query(
      `SELECT va.* FROM virtual_accounts va
       JOIN goals g ON g.id = va.goal_id
       WHERE va.goal_id = ? AND g.user_id = ? AND va.status = 'active'`,
      [goalId, userId],
    );
    return rows[0] ?? null;
  },

  async findAllByUser(userId: string) {
    return query(
      `SELECT va.id, va.goal_id, g.title AS goal_title,
              va.account_number, va.account_name, va.bank_name, va.status,
              COALESCE(SUM(CASE WHEN t.status = 'successful' THEN t.amount ELSE 0 END), 0) AS total_received
       FROM virtual_accounts va
       JOIN goals g ON g.id = va.goal_id
       LEFT JOIN transactions t ON t.virtual_account_id = va.id
       WHERE g.user_id = ?
       GROUP BY va.id, va.goal_id, g.title, va.account_number, va.account_name, va.bank_name, va.status
       ORDER BY va.created_at DESC`,
      [userId],
    );
  },

  async findByIdAndUser(vaId: string, userId: string) {
    const rows = await query(
      `SELECT va.*, g.title AS goal_title, g.target_amount, g.current_amount
       FROM virtual_accounts va
       JOIN goals g ON g.id = va.goal_id
       WHERE va.id = ? AND g.user_id = ?`,
      [vaId, userId],
    );
    return rows[0] ?? null;
  },

  async markInactive(id: string) {
    await execute(
      `UPDATE virtual_accounts SET status = 'inactive', expired_at = COALESCE(expired_at, NOW()) WHERE id = ?`,
      [id],
    );
    const rows = await query('SELECT * FROM virtual_accounts WHERE id = ?', [id]);
    return rows[0] ?? null;
  },

  async findByAccountNumber(accountNumber: string) {
    const rows = await query(
      `SELECT * FROM virtual_accounts WHERE account_number = ? AND status = 'active'`,
      [accountNumber],
    );
    return rows[0] ?? null;
  },

  async findBySlug(slug: string) {
    const rows = await query(
      `SELECT va.account_number, va.account_name, va.bank_name
       FROM virtual_accounts va
       JOIN goals g ON g.id = va.goal_id
       WHERE (g.slug = ? OR g.id = ?) AND g.status = 'active' AND va.status = 'active'`,
      [slug, slug],
    );
    return rows[0] ?? null;
  },
};
