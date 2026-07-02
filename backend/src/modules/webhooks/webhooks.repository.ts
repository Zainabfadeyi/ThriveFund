import { query, execute } from '../../config/database';

export const webhooksRepository = {
  async insertEvent(data: {
    id: string;
    provider?: string;
    event_type: string;
    provider_reference: string;
    payload: string;
  }) {
    await execute(
      `INSERT IGNORE INTO webhook_events
         (id, provider, event_type, provider_reference, payload, status, processed, received_at)
       VALUES (?, ?, ?, ?, ?, 'received', 0, NOW())`,
      [data.id, data.provider ?? 'nomba', data.event_type, data.provider_reference, data.payload],
    );
    const rows = await query('SELECT * FROM webhook_events WHERE provider_reference = ?', [data.provider_reference]);
    return rows[0] ?? null;
  },

  async markProcessed(providerReference: string) {
    await execute(
      `UPDATE webhook_events SET processed = 1, status = 'processed', processed_at = NOW()
       WHERE provider_reference = ?`,
      [providerReference],
    );
  },

  async markStatus(providerReference: string, status: string, errorMessage?: string) {
    await execute(
      `UPDATE webhook_events SET status = ?, processed = ?, processed_at = NOW(), error_message = ?
       WHERE provider_reference = ?`,
      [status, status === 'processed' || status === 'duplicate' ? 1 : 0, errorMessage ?? null, providerReference],
    );
  },

  async markFailed(providerReference: string, error: string) {
    await execute(
      `UPDATE webhook_events SET status = 'failed', error_message = ? WHERE provider_reference = ?`,
      [error, providerReference],
    );
  },

  async findAll(filters: {
    processed?: boolean;
    event_type?: string;
    page: number;
    perPage: number;
  }) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.processed !== undefined) {
      conditions.push('processed = ?');
      values.push(filters.processed ? 1 : 0);
    }
    if (filters.event_type) {
      conditions.push('event_type = ?');
      values.push(filters.event_type);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return query(
      `SELECT id, event_type, provider_reference, status, processed, processed_at, received_at
       FROM webhook_events ${where}
       ORDER BY received_at DESC LIMIT ? OFFSET ?`,
      [...values, filters.perPage, (filters.page - 1) * filters.perPage],
    );
  },

  async findById(id: string) {
    const rows = await query('SELECT * FROM webhook_events WHERE id = ?', [id]);
    return rows[0] ?? null;
  },

  async findByProviderReference(ref: string) {
    const rows = await query('SELECT * FROM webhook_events WHERE provider_reference = ?', [ref]);
    return rows[0] ?? null;
  },

  async listAdminRecipients() {
    return query<{ email: string; full_name: string }>(
      `SELECT email, full_name
       FROM users
       WHERE role = 'admin'
       ORDER BY created_at ASC
       LIMIT 10`,
    );
  },
};
