import { query, execute } from '../../config/database';

export const organizationsRepository = {
  async insert(data: {
    id: string;
    name: string;
    slug: string;
    type: string;
    description?: string;
    email?: string;
    phone?: string;
    address?: string;
    owner_id: string;
  }) {
    await execute(
      `INSERT INTO organizations (id, name, slug, type, description, email, phone, address, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.id, data.name, data.slug, data.type, data.description ?? null,
       data.email ?? null, data.phone ?? null, data.address ?? null, data.owner_id],
    );
    const rows = await query('SELECT * FROM organizations WHERE id = ?', [data.id]);
    return rows[0];
  },

  async findById(id: string) {
    const rows = await query('SELECT * FROM organizations WHERE id = ?', [id]);
    return rows[0] ?? null;
  },

  async findDetailById(id: string) {
    const org = await this.findById(id);
    if (!org) return null;

    const campaigns = await query(
      `SELECT g.*,
              ROUND((g.current_amount / NULLIF(g.target_amount, 0)) * 100, 1) AS progress_percent,
              (SELECT COUNT(*) FROM contributors c WHERE c.goal_id = g.id) AS contributors_count
       FROM goals g
       WHERE g.organization_id = ?
       ORDER BY g.created_at DESC
       LIMIT 50`,
      [id],
    );

    const recentTransactions = await query(
      `SELECT t.*, g.title AS goal_title, o.name AS organization_name
       FROM transactions t
       JOIN goals g ON g.id = t.goal_id
       LEFT JOIN organizations o ON o.id = g.organization_id
       WHERE g.organization_id = ?
       ORDER BY COALESCE(t.paid_at, t.created_at) DESC
       LIMIT 15`,
      [id],
    );

    const totals = await query<{
      campaigns_count: number;
      total_collected: number | string | null;
      total_target: number | string | null;
      active_campaigns: number;
      completed_campaigns: number;
    }>(
      `SELECT COUNT(*) AS campaigns_count,
              COALESCE(SUM(current_amount), 0) AS total_collected,
              COALESCE(SUM(target_amount), 0) AS total_target,
              SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_campaigns,
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_campaigns
       FROM goals
       WHERE organization_id = ?`,
      [id],
    );

    return {
      ...org,
      ...(totals[0] ?? {}),
      campaigns,
      recent_transactions: recentTransactions,
    };
  },

  async canAccess(id: string, userId: string): Promise<boolean> {
    const rows = await query<{ id: string }>(
      `SELECT o.id
       FROM organizations o
       LEFT JOIN organization_members om ON om.organization_id = o.id
       WHERE o.id = ? AND (o.owner_id = ? OR om.user_id = ?)
       LIMIT 1`,
      [id, userId, userId],
    );
    return Boolean(rows[0]);
  },

  async findBySlug(slug: string) {
    const rows = await query('SELECT * FROM organizations WHERE slug = ?', [slug]);
    return rows[0] ?? null;
  },

  async findByUser(userId: string, page: number, perPage: number) {
    const offset = (page - 1) * perPage;
    const countRows = await query<{ total: number }>(
      `SELECT COUNT(DISTINCT o.id) AS total
       FROM organizations o
       LEFT JOIN organization_members om ON om.organization_id = o.id
       WHERE o.owner_id = ? OR om.user_id = ?`,
      [userId, userId],
    );
    const rows = await query(
      `SELECT DISTINCT o.*,
              COALESCE(gt.campaigns_count, 0) AS campaigns_count,
              COALESCE(gt.total_collected, 0) AS total_collected,
              COALESCE(gt.total_target, 0) AS total_target
       FROM organizations o
       LEFT JOIN organization_members om ON om.organization_id = o.id
       LEFT JOIN (
         SELECT organization_id,
                COUNT(*) AS campaigns_count,
                COALESCE(SUM(current_amount), 0) AS total_collected,
                COALESCE(SUM(target_amount), 0) AS total_target
         FROM goals
         GROUP BY organization_id
       ) gt ON gt.organization_id = o.id
       WHERE o.owner_id = ? OR om.user_id = ?
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [userId, userId, perPage, offset],
    );
    return { rows, total: Number(countRows[0].total) };
  },

  async update(id: string, fields: Record<string, unknown>) {
    const allowed = ['name', 'type', 'description', 'email', 'phone', 'address'];
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (!sets.length) return this.findById(id);
    values.push(id);
    await execute(`UPDATE organizations SET ${sets.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },
};
