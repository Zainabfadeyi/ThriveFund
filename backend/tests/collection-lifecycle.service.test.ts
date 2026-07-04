import test from 'node:test';
import assert from 'node:assert/strict';
import { setTestEnv } from './helpers';

setTestEnv();

test('collectionLifecycleService closeCollectionEarly expires VA and marks completed', async () => {
  process.env.COLLECTION_GRACE_DAYS = '7';
  const { collectionLifecycleService } = await import('../src/modules/goals/collection-lifecycle.service');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');
  const { virtualAccountsRepository } = await import('../src/modules/virtual-accounts/virtual-accounts.repository');
  const { notificationsRepository } = await import('../src/modules/notifications/notifications.repository');
  const { NombaProvider } = await import('../src/providers/payment/nomba.provider');
  const audit = await import('../src/lib/audit');

  const expired: string[] = [];
  goalsRepository.findByIdRaw = async () => ({
    id: 'goal_123',
    user_id: 'usr_123',
    organization_id: 'org_123',
    title: 'Wedding fund',
    current_amount: 5000,
    target_amount: 100000,
    status: 'active',
    slug: 'wedding-fund',
  });
  virtualAccountsRepository.findActiveByGoalAndUser = async () => ({
    id: 'va_123',
    provider_reference: 'nomba_va_123',
    account_number: '9391076543',
  });
  goalsRepository.markClosedEarly = async () => ({
    id: 'goal_123',
    status: 'completed',
    current_amount: 5000,
    closed_at: new Date().toISOString(),
  });
  notificationsRepository.insert = async (data: Record<string, unknown>) => ({ id: data.id, ...data });
  audit.logAudit = async () => undefined;
  NombaProvider.prototype.expireVirtualAccount = async (identifier: string) => {
    expired.push(identifier);
    return { expired: true, providerReference: identifier, raw: {} };
  };
  virtualAccountsRepository.markInactive = async (id: string) => ({ id, status: 'inactive' });

  const result = await collectionLifecycleService.closeCollectionEarly('usr_123', 'goal_123');

  assert.equal(result.goal.status, 'completed');
  assert.deepEqual(expired, ['nomba_va_123']);
  assert.equal(result.expiry?.expired, true);
});

test('collectionLifecycleService completeAtTarget schedules grace without immediate expiry', async () => {
  process.env.COLLECTION_GRACE_DAYS = '7';
  const { collectionLifecycleService } = await import('../src/modules/goals/collection-lifecycle.service');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');
  const { NombaProvider } = await import('../src/providers/payment/nomba.provider');

  let markCompletedGrace: number | null | undefined;
  let expireCalled = false;
  goalsRepository.markCompleted = async (_goalId: string, graceDays?: number | null) => {
    markCompletedGrace = graceDays ?? null;
    return { id: 'goal_123', status: 'completed', collection_expires_at: '2099-01-01' };
  };
  NombaProvider.prototype.expireVirtualAccount = async () => {
    expireCalled = true;
    return { expired: true, providerReference: 'x', raw: {} };
  };

  const result = await collectionLifecycleService.completeAtTarget(
    'goal_123',
    { id: 'va_123', provider_reference: 'nomba_va_123', account_number: '9391076543' },
    { title: 'School fees' },
  );

  assert.equal(result.graceDays, 7);
  assert.equal(markCompletedGrace, 7);
  assert.equal(expireCalled, false);
  assert.equal(result.expiryResult, null);
});

test('collectionLifecycleService processDueExpirations expires overdue accounts', async () => {
  const { collectionLifecycleService } = await import('../src/modules/goals/collection-lifecycle.service');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');
  const { virtualAccountsRepository } = await import('../src/modules/virtual-accounts/virtual-accounts.repository');
  const { NombaProvider } = await import('../src/providers/payment/nomba.provider');
  const audit = await import('../src/lib/audit');

  goalsRepository.findDueForCollectionExpiry = async () => [{
    goal_id: 'goal_123',
    user_id: 'usr_123',
    organization_id: 'org_123',
    slug: 'school-fees',
    va_id: 'va_123',
    provider_reference: 'nomba_va_123',
    account_number: '9391076543',
  }];
  goalsRepository.clearCollectionExpiry = async () => undefined;
  audit.logAudit = async () => undefined;
  NombaProvider.prototype.expireVirtualAccount = async () => ({
    expired: true,
    providerReference: 'nomba_va_123',
    raw: {},
  });
  virtualAccountsRepository.markInactive = async (id: string) => ({ id, status: 'inactive' });

  const result = await collectionLifecycleService.processDueExpirations();

  assert.equal(result.processed, 1);
  assert.equal(result.results[0].expired, true);
});
