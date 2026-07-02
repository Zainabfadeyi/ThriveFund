import { execute, query } from '../../config/database';

export const payoutAccountsRepository = {
  async findByUser(userId: string) {
    return query(
      `SELECT *
       FROM payout_accounts
       WHERE user_id = ?
       ORDER BY is_default DESC, created_at DESC`,
      [userId],
    );
  },

  async findByIdForUser(id: string, userId: string) {
    const rows = await query(
      `SELECT *
       FROM payout_accounts
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [id, userId],
    );
    return rows[0] ?? null;
  },

  async findDefaultForUser(userId: string) {
    const rows = await query(
      `SELECT *
       FROM payout_accounts
       WHERE user_id = ? AND is_default = 1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );
    return rows[0] ?? null;
  },

  async insert(data: {
    id: string;
    user_id: string;
    organization_id?: string | null;
    provider: string;
    bank_code: string;
    bank_name?: string | null;
    account_number: string;
    account_name: string;
    is_default: boolean;
  }) {
    if (data.is_default) {
      await this.clearDefault(data.user_id);
    }

    await execute(
      `INSERT INTO payout_accounts
         (id, user_id, organization_id, provider, bank_code, bank_name, account_number,
          account_name, is_default, verified_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         bank_name = VALUES(bank_name),
         account_name = VALUES(account_name),
         is_default = VALUES(is_default),
         verified_at = NOW(),
         updated_at = NOW()`,
      [
        data.id,
        data.user_id,
        data.organization_id ?? null,
        data.provider,
        data.bank_code,
        data.bank_name ?? null,
        data.account_number,
        data.account_name,
        data.is_default ? 1 : 0,
      ],
    );

    const rows = await query(
      `SELECT *
       FROM payout_accounts
       WHERE user_id = ? AND bank_code = ? AND account_number = ?
       LIMIT 1`,
      [data.user_id, data.bank_code, data.account_number],
    );
    return rows[0];
  },

  async clearDefault(userId: string) {
    await execute('UPDATE payout_accounts SET is_default = 0 WHERE user_id = ?', [userId]);
  },

  async setDefault(id: string, userId: string) {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return null;
    await this.clearDefault(userId);
    await execute('UPDATE payout_accounts SET is_default = 1, updated_at = NOW() WHERE id = ?', [id]);
    return this.findByIdForUser(id, userId);
  },

  async delete(id: string, userId: string) {
    const result = await execute('DELETE FROM payout_accounts WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows;
  },
};
