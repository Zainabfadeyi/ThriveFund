import { query, execute, db } from '../../config/database';

export const authRepository = {
  async findUserByEmail(email: string) {
    const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] ?? null;
  },

  async findUserById(id: string) {
    const rows = await query(
      'SELECT id, full_name, email, role, email_verified_at FROM users WHERE id = ?',
      [id],
    );
    return rows[0] ?? null;
  },

  async insertUser(data: {
    id: string;
    full_name: string;
    email: string;
    password_hash: string;
    phone_number?: string | null;
  }) {
    await execute(
      `INSERT INTO users (id, full_name, email, password_hash, phone_number, role, created_at)
       VALUES (?, ?, ?, ?, ?, 'user', NOW())`,
      [data.id, data.full_name, data.email, data.password_hash, data.phone_number ?? null],
    );
    const rows = await query(
      'SELECT id, full_name, email, role, email_verified_at, created_at FROM users WHERE id = ?',
      [data.id],
    );
    return rows[0];
  },

  async insertUserWithOrganization(data: {
    user: {
      id: string;
      full_name: string;
      email: string;
      password_hash: string;
      phone_number?: string | null;
    };
    organization: {
      id: string;
      name: string;
      slug: string;
      type: string;
      description?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
    };
    membership: { id: string };
  }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        `INSERT INTO users (id, full_name, email, password_hash, phone_number, role, created_at)
         VALUES (?, ?, ?, ?, ?, 'user', NOW())`,
        [data.user.id, data.user.full_name, data.user.email, data.user.password_hash, data.user.phone_number ?? null],
      );
      await connection.execute(
        `INSERT INTO organizations (id, name, slug, type, description, email, phone, address, owner_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.organization.id,
          data.organization.name,
          data.organization.slug,
          data.organization.type,
          data.organization.description ?? null,
          data.organization.email ?? null,
          data.organization.phone ?? null,
          data.organization.address ?? null,
          data.user.id,
        ],
      );
      await connection.execute(
        `INSERT INTO organization_members (id, organization_id, user_id, role)
         VALUES (?, ?, ?, 'owner')`,
        [data.membership.id, data.organization.id, data.user.id],
      );
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    const users = await query(
      'SELECT id, full_name, email, role, email_verified_at, created_at FROM users WHERE id = ?',
      [data.user.id],
    );
    const organizations = await query('SELECT * FROM organizations WHERE id = ?', [data.organization.id]);
    return { user: users[0], organization: organizations[0] };
  },

  async insertRefreshToken(token: string, userId: string) {
    await execute(
      `INSERT INTO refresh_tokens (token, user_id, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [token, userId],
    );
  },

  async findRefreshToken(token: string) {
    const rows = await query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [token],
    );
    return rows[0] ?? null;
  },

  async deleteRefreshToken(token: string) {
    await execute('DELETE FROM refresh_tokens WHERE token = ?', [token]);
  },

  async insertPasswordReset(data: { token: string; user_id: string; expires_at: Date }) {
    await execute(
      'INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)',
      [data.token, data.user_id, data.expires_at],
    );
  },

  async findPasswordReset(token: string) {
    const rows = await query(
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW() AND used = 0',
      [token],
    );
    return rows[0] ?? null;
  },

  async updatePasswordHash(userId: string, passwordHash: string) {
    await execute(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, userId],
    );
  },

  async markPasswordResetUsed(token: string) {
    await execute('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);
  },

  async insertEmailVerification(data: { token: string; user_id: string; expires_at: Date }) {
    await execute(
      'INSERT INTO email_verifications (token, user_id, expires_at) VALUES (?, ?, ?)',
      [data.token, data.user_id, data.expires_at],
    );
  },

  async findEmailVerification(token: string) {
    const rows = await query(
      `SELECT ev.*, u.email, u.full_name, u.email_verified_at
       FROM email_verifications ev
       JOIN users u ON u.id = ev.user_id
       WHERE ev.token = ? AND ev.expires_at > NOW() AND ev.used = 0
       LIMIT 1`,
      [token],
    );
    return rows[0] ?? null;
  },

  async markEmailVerificationUsed(token: string) {
    await execute('UPDATE email_verifications SET used = 1 WHERE token = ?', [token]);
  },

  async markEmailVerified(userId: string) {
    await execute(
      'UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = ?',
      [userId],
    );
    return this.findUserById(userId);
  },
};
