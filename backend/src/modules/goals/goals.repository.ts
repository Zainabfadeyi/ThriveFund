import { query, execute } from '../../config/database';

export interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  [key: string]: unknown;
}

export const goalsRepository = {
  async insert(data: {
    id: string;
    user_id: string;
    organization_id?: string | null;
    title: string;
    description?: string | null;
    target_amount: number;
    category: string;
    deadline: string;
    color?: string | null;
    slug?: string | null;
  }): Promise<GoalRow> {
    await execute(
      `INSERT INTO goals (id, user_id, organization_id, title, description, target_amount, category, deadline, color, slug, status, current_amount, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, NOW())`,
      [data.id, data.user_id, data.organization_id ?? null, data.title, data.description ?? null,
       data.target_amount, data.category, data.deadline, data.color ?? null, data.slug ?? null],
    );
    const rows = await query<GoalRow>(
      `SELECT *,
              GREATEST(0, DATEDIFF(deadline, NOW())) AS days_left,
              ROUND((current_amount / NULLIF(target_amount, 0)) * 100) AS progress_percent
       FROM goals WHERE id = ?`,
      [data.id],
    );
    return rows[0];
  },

  async findAllByUser(
    userId: string,
    filters: { status?: string; category?: string; q?: string; page: number; perPage: number },
  ) {
    const conditions = ['user_id = ?'];
    const values: unknown[] = [userId];

    if (filters.status)   { conditions.push('status = ?');      values.push(filters.status); }
    if (filters.category) { conditions.push('category = ?');    values.push(filters.category); }
    if (filters.q)        { conditions.push('title LIKE ?');    values.push(`%${filters.q}%`); }

    const where = conditions.join(' AND ');

    const countRows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM goals WHERE ${where}`,
      values,
    );

    const rows = await query<GoalRow>(
      `SELECT goals.id, goals.organization_id, goals.title, goals.slug, goals.category, goals.target_amount,
              goals.current_amount, goals.status, goals.color, organizations.name AS organization_name,
              GREATEST(0, DATEDIFF(deadline, NOW())) AS days_left,
              ROUND((current_amount / NULLIF(target_amount, 0)) * 100) AS progress_percent,
              (SELECT COUNT(DISTINCT LOWER(TRIM(contributor_name))) FROM transactions WHERE goal_id = goals.id AND status = 'successful') AS contributors_count
       FROM goals
       LEFT JOIN organizations ON organizations.id = goals.organization_id
       WHERE ${where}
       ORDER BY goals.created_at DESC LIMIT ? OFFSET ?`,
      [...values, filters.perPage, (filters.page - 1) * filters.perPage],
    );

    return { rows, total: Number(countRows[0].total) };
  },

  async findById(goalId: string, userId: string): Promise<GoalRow | null> {
    const rows = await query<GoalRow>(
      `SELECT *,
              GREATEST(0, DATEDIFF(deadline, NOW())) AS days_left,
              ROUND((current_amount / NULLIF(target_amount, 0)) * 100) AS progress_percent,
              target_amount - current_amount AS remaining_amount,
              (SELECT COUNT(DISTINCT LOWER(TRIM(contributor_name))) FROM transactions WHERE goal_id = goals.id AND status = 'successful') AS contributors_count
       FROM goals WHERE id = ? AND user_id = ?`,
      [goalId, userId],
    );
    if (!rows[0]) return null;

    const goal = rows[0];
    // Fetch linked virtual account separately (MySQL < 8.0.14 doesn't support LATERAL)
    const vaRows = await query(
      `SELECT id, account_number, account_name, bank_name, status
       FROM virtual_accounts WHERE goal_id = ? LIMIT 1`,
      [goalId],
    );
    goal.virtual_account = vaRows[0] ?? null;
    return goal;
  },

  async findByIdRaw(goalId: string, userId: string): Promise<GoalRow | null> {
    const rows = await query<GoalRow>(
      'SELECT id, slug, title, organization_id, target_amount, current_amount, status FROM goals WHERE id = ? AND user_id = ?',
      [goalId, userId],
    );
    return rows[0] ?? null;
  },

  async slugExists(slug: string): Promise<boolean> {
    const rows = await query<{ id: string }>('SELECT id FROM goals WHERE slug = ? LIMIT 1', [slug]);
    return rows.length > 0;
  },

  async updateSlug(goalId: string, slug: string) {
    await execute('UPDATE goals SET slug = ?, updated_at = NOW() WHERE id = ?', [slug, goalId]);
  },

  async update(goalId: string, userId: string, fields: Record<string, unknown>): Promise<GoalRow | null> {
    const allowed = ['organization_id', 'title', 'description', 'target_amount', 'category', 'deadline', 'color'];
    const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!entries.length) return null;

    const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
    const values = [...entries.map(([, v]) => v), goalId, userId];
    const result = await execute(
      `UPDATE goals SET ${setClauses}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
      values,
    );
    if (!result.affectedRows) return null;

    const rows = await query<GoalRow>('SELECT * FROM goals WHERE id = ?', [goalId]);
    return rows[0] ?? null;
  },

  async delete(goalId: string, userId: string): Promise<number> {
    const result = await execute(
      'DELETE FROM goals WHERE id = ? AND user_id = ?',
      [goalId, userId],
    );
    return result.affectedRows;
  },

  async updateStatus(goalId: string, userId: string, status: string): Promise<GoalRow | null> {
    const result = await execute(
      'UPDATE goals SET status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [status, goalId, userId],
    );
    if (!result.affectedRows) return null;
    const rows = await query<GoalRow>('SELECT * FROM goals WHERE id = ?', [goalId]);
    return rows[0] ?? null;
  },

  async markClosedOut(goalId: string, userId: string): Promise<GoalRow | null> {
    const result = await execute(
      `UPDATE goals
       SET status = 'completed',
           completed_at = COALESCE(completed_at, NOW()),
           closed_at = COALESCE(closed_at, NOW()),
           updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [goalId, userId],
    );
    if (!result.affectedRows) return null;
    const rows = await query<GoalRow>('SELECT * FROM goals WHERE id = ?', [goalId]);
    return rows[0] ?? null;
  },

  async markCompleted(goalId: string): Promise<GoalRow | null> {
    const result = await execute(
      `UPDATE goals
       SET status = 'completed', completed_at = COALESCE(completed_at, NOW()), updated_at = NOW()
       WHERE id = ? AND status <> 'completed'`,
      [goalId],
    );
    if (!result.affectedRows) {
      const current = await query<GoalRow>('SELECT * FROM goals WHERE id = ?', [goalId]);
      return current[0] ?? null;
    }
    const rows = await query<GoalRow>('SELECT * FROM goals WHERE id = ?', [goalId]);
    return rows[0] ?? null;
  },

  async incrementAmount(goalId: string, amount: number) {
    await execute(
      'UPDATE goals SET current_amount = current_amount + ?, updated_at = NOW() WHERE id = ?',
      [amount, goalId],
    );
  },

  async findCompletionState(goalId: string): Promise<GoalRow | null> {
    const rows = await query<GoalRow>(
      `SELECT g.id, g.user_id, g.organization_id, g.title, g.slug, g.current_amount, g.target_amount, g.status, u.email
       FROM goals g
       JOIN users u ON u.id = g.user_id
       WHERE g.id = ?`,
      [goalId],
    );
    return rows[0] ?? null;
  },

  async findOwnerByGoalId(goalId: string): Promise<{ user_id: string; title: string; email: string } | null> {
    const rows = await query<{ user_id: string; title: string; email: string }>(
      `SELECT g.user_id, g.title, u.email
       FROM goals g JOIN users u ON u.id = g.user_id
       WHERE g.id = ?`,
      [goalId],
    );
    return rows[0] ?? null;
  },

  async findBySlug(slug: string): Promise<GoalRow | null> {
    const rows = await query<GoalRow>(
      `SELECT id, slug, title, description, target_amount, current_amount, status,
              ROUND((current_amount / NULLIF(target_amount, 0)) * 100) AS progress_percent,
              deadline, allow_anonymous
       FROM goals WHERE (slug = ? OR id = ?) AND status IN ('active', 'completed')`,
      [slug, slug],
    );
    return rows[0] ?? null;
  },

  async exportPack(goalId: string, userId?: string) {
    const userWhere = userId ? 'AND g.user_id = ?' : '';
    const userValues = userId ? [userId] : [];
    const goals = await query(
      `SELECT g.*, o.name AS organization_name
       FROM goals g
       LEFT JOIN organizations o ON o.id = g.organization_id
       WHERE g.id = ? ${userWhere}`,
      [goalId, ...userValues],
    );
    if (!goals[0]) return null;

    const [transactions, contributors, virtualAccounts, reconciliation] = await Promise.all([
      query(
        `SELECT
           t.id AS transaction_id,
           t.contributor_name AS payer_name,
           t.amount,
           t.status AS payment_status,
           t.paid_at AS date_paid,
           t.reference AS transfer_reference,
           t.provider_reference,
           va.account_number AS virtual_account_number,
           va.bank_name,
           rr.status AS reconciliation_status,
           p.status AS verification_status,
           t.created_at
         FROM transactions t
         LEFT JOIN virtual_accounts va ON va.id = t.virtual_account_id
         LEFT JOIN payments p ON p.id = t.payment_id
         LEFT JOIN reconciliation_records rr ON rr.id = t.reconciliation_id
         WHERE t.goal_id = ?
         ORDER BY COALESCE(t.paid_at, t.created_at) DESC`,
        [goalId],
      ),
      query(
        `SELECT name, email, phone_number, group_label, expected_amount, unique_reference, created_at
         FROM contributors WHERE goal_id = ? ORDER BY created_at DESC`,
        [goalId],
      ),
      query(
        `SELECT account_number, account_name, bank_name, provider_reference, status, created_at
         FROM virtual_accounts WHERE goal_id = ? ORDER BY created_at DESC`,
        [goalId],
      ),
      query(
        `SELECT rr.status, rr.notes, rr.processed_at, rr.created_at, p.amount, p.payer_name, p.provider_reference
         FROM reconciliation_records rr
         LEFT JOIN payments p ON p.id = rr.payment_id
         WHERE rr.goal_id = ? ORDER BY rr.created_at DESC`,
        [goalId],
      ),
    ]);

    return { goal: goals[0], transactions, contributors, virtual_accounts: virtualAccounts, reconciliation };
  },
};
