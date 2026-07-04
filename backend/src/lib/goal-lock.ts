import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { env } from '../config/env';
import { db } from '../config/database';

const LOCK_TIMEOUT_SEC = 20;

function lockName(goalId: string): string {
  return `tf:goal:pay:${goalId}`.slice(0, 64);
}

async function acquireLock(conn: PoolConnection, goalId: string): Promise<boolean> {
  const [rows] = await conn.query<RowDataPacket[]>(
    'SELECT GET_LOCK(?, ?) AS acquired',
    [lockName(goalId), LOCK_TIMEOUT_SEC],
  );
  return Number(rows[0]?.acquired) === 1;
}

async function releaseLock(conn: PoolConnection, goalId: string): Promise<void> {
  await conn.query('SELECT RELEASE_LOCK(?)', [lockName(goalId)]).catch(() => undefined);
}

/**
 * Serializes payment reconciliation for a single campaign so concurrent
 * webhooks credit the correct balance and completion runs exactly once.
 */
export async function withGoalPaymentLock<T>(goalId: string, fn: () => Promise<T>): Promise<T> {
  const nodeEnv = process.env.NODE_ENV ?? env.NODE_ENV;
  if (nodeEnv === 'test' || process.env.TF_SKIP_GOAL_PAYMENT_LOCK === '1') return fn();

  const conn = await db.getConnection();
  try {
    const acquired = await acquireLock(conn, goalId);
    if (!acquired) {
      throw new Error(`Timed out waiting for payment lock on goal ${goalId}`);
    }
    return await fn();
  } finally {
    await releaseLock(conn, goalId);
    conn.release();
  }
}
