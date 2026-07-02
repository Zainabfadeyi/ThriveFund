import mysql from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { env } from './env';

const isLocal = env.DB_HOST === 'localhost' || env.DB_HOST === '127.0.0.1';

export const db = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 50,
  // SSL only for remote hosts (e.g. AWS RDS)
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

/** Run a SELECT — returns typed rows. Uses query() not execute() so LIMIT/OFFSET placeholders work. */
export async function query<T = RowDataPacket>(
  sql: string,
  values?: unknown[],
): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows] = await db.query<(T & RowDataPacket)[]>(sql, values as any[]);
  return rows as T[];
}

/** Run an INSERT / UPDATE / DELETE — returns the result header. */
export async function execute(sql: string, values?: unknown[]): Promise<ResultSetHeader> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result] = await db.execute<ResultSetHeader>(sql, values as any[]);
  return result;
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    await db.execute('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
