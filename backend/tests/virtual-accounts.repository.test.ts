import test from 'node:test';
import assert from 'node:assert/strict';
import { setTestEnv } from './helpers';

setTestEnv();

test('virtualAccountsRepository insert writes organization_id with the account record', async () => {
  const database = await import('../src/config/database');
  const { virtualAccountsRepository } = await import('../src/modules/virtual-accounts/virtual-accounts.repository');

  const executed: Array<{ sql: string; values?: unknown[] }> = [];
  database.execute = async (sql: string, values?: unknown[]) => {
    executed.push({ sql, values });
    return { affectedRows: 1 } as never;
  };
  database.query = async () => [{ id: 'va_123' }] as never;

  await virtualAccountsRepository.insert({
    id: 'va_123',
    goal_id: 'goal_123',
    organization_id: 'org_123',
    provider: 'nomba',
    provider_account_id: 'holder_123',
    account_number: '9391076543',
    account_name: 'Nomba Test User',
    bank_name: 'Nombank MFB',
    provider_reference: 'TFgoal123',
  });

  assert.match(executed[0].sql, /organization_id/);
  assert.deepEqual(executed[0].values?.slice(0, 4), ['va_123', 'goal_123', 'org_123', 'nomba']);
});
