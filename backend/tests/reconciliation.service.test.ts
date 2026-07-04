import test from 'node:test';
import assert from 'node:assert/strict';
import { setTestEnv } from './helpers';

setTestEnv();

test('reconciliationService creates unmatched record when account number is unknown', async () => {
  const { reconciliationService } = await import('../src/modules/reconciliation/reconciliation.service');
  const { virtualAccountsRepository } = await import('../src/modules/virtual-accounts/virtual-accounts.repository');
  const { reconciliationRepository } = await import('../src/modules/reconciliation/reconciliation.repository');

  virtualAccountsRepository.findByAccountNumber = async () => null;
  reconciliationRepository.insert = async (data: Record<string, unknown>) => ({ id: data.id, ...data });

  const result = await reconciliationService.reconcilePayment({
    id: 'pay_123',
    provider_reference: 'session_123',
    account_number: '0000000000',
    amount: 5000,
    payer_name: 'Ada',
    reference: 'TFgoal123',
    status: 'verified',
  });

  assert.equal(result.matched, false);
  assert.equal(result.reconciliation.status, 'unmatched');
  assert.match(String(result.reconciliation.notes), /No virtual account/);
});

test('reconciliationService creates transaction, increments goal, and keeps organization context', async () => {
  const { reconciliationService } = await import('../src/modules/reconciliation/reconciliation.service');
  const { virtualAccountsRepository } = await import('../src/modules/virtual-accounts/virtual-accounts.repository');
  const { reconciliationRepository } = await import('../src/modules/reconciliation/reconciliation.repository');
  const { transactionsRepository } = await import('../src/modules/transactions/transactions.repository');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');
  const { contributorsRepository } = await import('../src/modules/contributors/contributors.repository');
  const { notificationsRepository } = await import('../src/modules/notifications/notifications.repository');
  const { webhooksRepository } = await import('../src/modules/webhooks/webhooks.repository');
  const audit = await import('../src/lib/audit');
  const email = await import('../src/lib/email');

  const transactions: Record<string, unknown>[] = [];
  const contributors: Record<string, unknown>[] = [];
  const increments: Array<{ goalId: string; amount: number }> = [];

  virtualAccountsRepository.findByAccountNumber = async () => ({
    id: 'va_123',
    goal_id: 'goal_123',
    organization_id: 'org_123',
  });
  transactionsRepository.insert = async (data: Record<string, unknown>) => {
    transactions.push(data);
    return { id: data.id, ...data };
  };
  contributorsRepository.findByGoalAndNormalizedName = async () => null;
  contributorsRepository.insertAutoDetected = async (data: Record<string, unknown>) => {
    contributors.push(data);
    return { id: data.id, ...data };
  };
  goalsRepository.incrementAmount = async (goalId: string, amount: number) => {
    increments.push({ goalId, amount });
    return { id: goalId };
  };
  goalsRepository.findCompletionState = async () => ({
    id: 'goal_123',
    user_id: 'usr_123',
    organization_id: 'org_123',
    title: 'School fees',
    current_amount: 5000,
    target_amount: 10000,
    status: 'active',
  });
  reconciliationRepository.insert = async (data: Record<string, unknown>) => ({ id: data.id, ...data });
  webhooksRepository.markStatus = async () => ({ id: 'wh_123' });
  goalsRepository.findOwnerByGoalId = async () => null;
  notificationsRepository.insert = async () => ({ id: 'ntf_123' });
  audit.logAudit = async () => undefined;
  email.sendPaymentReceivedEmail = async () => undefined;

  const result = await reconciliationService.reconcilePayment({
    id: 'pay_123',
    webhook_event_id: 'wh_123',
    provider_reference: 'session_123',
    account_number: '9391076543',
    amount: 5000,
    payer_name: 'Ada',
    reference: 'TFgoal123',
    status: 'verified',
    paid_at: '2026-07-02T08:00:00.000Z',
  });

  assert.equal(result.matched, true);
  assert.equal(transactions[0].organization_id, 'org_123');
  assert.equal(transactions[0].status, 'successful');
  assert.equal(contributors.length, 1);
  assert.equal(contributors[0].goal_id, 'goal_123');
  assert.equal(contributors[0].organization_id, 'org_123');
  assert.equal(contributors[0].name, 'Ada');
  assert.deepEqual(increments, [{ goalId: 'goal_123', amount: 5000 }]);
});

test('reconciliationService auto-creates one contributor for repeat successful payer names', async () => {
  const { reconciliationService } = await import('../src/modules/reconciliation/reconciliation.service');
  const { virtualAccountsRepository } = await import('../src/modules/virtual-accounts/virtual-accounts.repository');
  const { reconciliationRepository } = await import('../src/modules/reconciliation/reconciliation.repository');
  const { transactionsRepository } = await import('../src/modules/transactions/transactions.repository');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');
  const { contributorsRepository } = await import('../src/modules/contributors/contributors.repository');
  const { notificationsRepository } = await import('../src/modules/notifications/notifications.repository');
  const { webhooksRepository } = await import('../src/modules/webhooks/webhooks.repository');
  const audit = await import('../src/lib/audit');
  const email = await import('../src/lib/email');

  const contributors: Record<string, unknown>[] = [];
  const transactions: Record<string, unknown>[] = [];

  virtualAccountsRepository.findByAccountNumber = async () => ({
    id: 'va_123',
    goal_id: 'goal_123',
    organization_id: 'org_123',
  });
  contributorsRepository.findByGoalAndNormalizedName = async (_goalId: string, name: string) => (
    contributors.find((row) => String(row.name).trim().toLowerCase() === name.trim().toLowerCase()) ?? null
  );
  contributorsRepository.insertAutoDetected = async (data: Record<string, unknown>) => {
    contributors.push(data);
    return { id: data.id, ...data };
  };
  transactionsRepository.insert = async (data: Record<string, unknown>) => {
    transactions.push(data);
    return { id: data.id, ...data };
  };
  goalsRepository.incrementAmount = async (goalId: string) => ({ id: goalId });
  goalsRepository.findCompletionState = async () => ({
    id: 'goal_123',
    user_id: 'usr_123',
    organization_id: 'org_123',
    title: 'School fees',
    current_amount: 0,
    target_amount: 100000,
    status: 'active',
  });
  reconciliationRepository.insert = async (data: Record<string, unknown>) => ({ id: data.id, ...data });
  webhooksRepository.markStatus = async () => ({ id: 'wh_123' });
  goalsRepository.findOwnerByGoalId = async () => null;
  notificationsRepository.insert = async () => ({ id: 'ntf_123' });
  audit.logAudit = async () => undefined;
  email.sendPaymentReceivedEmail = async () => undefined;

  await reconciliationService.reconcilePayment({
    id: 'pay_123',
    provider_reference: 'session_123',
    account_number: '9391076543',
    amount: 5000,
    payer_name: ' Ada  Okafor ',
    reference: 'TFgoal123',
    status: 'verified',
  });

  await reconciliationService.reconcilePayment({
    id: 'pay_456',
    provider_reference: 'session_456',
    account_number: '9391076543',
    amount: 3000,
    payer_name: 'ada okafor',
    reference: 'TFgoal123',
    status: 'verified',
  });

  assert.equal(contributors.length, 1);
  assert.equal(contributors[0].name, 'Ada Okafor');
  assert.equal(transactions.length, 2);
});

test('reconciliationService completes campaign and expires account once target is reached', async () => {
  const { reconciliationService } = await import('../src/modules/reconciliation/reconciliation.service');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');
  const { virtualAccountsRepository } = await import('../src/modules/virtual-accounts/virtual-accounts.repository');
  const { notificationsRepository } = await import('../src/modules/notifications/notifications.repository');
  const { NombaProvider } = await import('../src/providers/payment/nomba.provider');
  const audit = await import('../src/lib/audit');

  const expired: string[] = [];
  const inactive: string[] = [];
  const notifications: Record<string, unknown>[] = [];

  goalsRepository.findCompletionState = async () => ({
    id: 'goal_123',
    user_id: 'usr_123',
    organization_id: 'org_123',
    title: 'School fees',
    current_amount: 10000,
    target_amount: 10000,
    status: 'active',
  });
  goalsRepository.markCompleted = async (goalId: string, _graceDays?: number | null) => ({
    id: goalId, status: 'completed', current_amount: 10000,
  });
  goalsRepository.clearCollectionExpiry = async () => undefined;
  virtualAccountsRepository.markInactive = async (id: string) => {
    inactive.push(id);
    return { id, status: 'inactive' };
  };
  notificationsRepository.insert = async (data: Record<string, unknown>) => {
    notifications.push(data);
    return { id: data.id, ...data };
  };
  audit.logAudit = async () => undefined;
  NombaProvider.prototype.expireVirtualAccount = async function expireVirtualAccount(identifier: string) {
    expired.push(identifier);
    return { expired: true, providerReference: identifier, raw: {} };
  };

  const result = await reconciliationService.completeCampaignIfTargetReached('goal_123', {
    id: 'va_123',
    account_number: '9391076543',
    provider_reference: 'nomba_va_123',
  });

  assert.equal(result?.completed, true);
  assert.deepEqual(expired, ['nomba_va_123']);
  assert.deepEqual(inactive, ['va_123']);
  assert.equal(notifications[0].type, 'campaign_completed');
});

test('reconciliationService completion is idempotent for already completed campaigns', async () => {
  const { reconciliationService } = await import('../src/modules/reconciliation/reconciliation.service');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');
  const { virtualAccountsRepository } = await import('../src/modules/virtual-accounts/virtual-accounts.repository');

  let markedInactive = false;
  goalsRepository.findCompletionState = async () => ({
    id: 'goal_123',
    user_id: 'usr_123',
    organization_id: 'org_123',
    title: 'School fees',
    current_amount: 15000,
    target_amount: 10000,
    status: 'completed',
  });
  virtualAccountsRepository.markInactive = async () => {
    markedInactive = true;
    return {};
  };

  const result = await reconciliationService.completeCampaignIfTargetReached('goal_123', {
    id: 'va_123',
    account_number: '9391076543',
  });

  assert.equal(result, null);
  assert.equal(markedInactive, false);
});

test('reconciliationService credits full over-payment amount and flags excess', async () => {
  const { reconciliationService } = await import('../src/modules/reconciliation/reconciliation.service');
  const { virtualAccountsRepository } = await import('../src/modules/virtual-accounts/virtual-accounts.repository');
  const { reconciliationRepository } = await import('../src/modules/reconciliation/reconciliation.repository');
  const { transactionsRepository } = await import('../src/modules/transactions/transactions.repository');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');
  const { contributorsRepository } = await import('../src/modules/contributors/contributors.repository');
  const { notificationsRepository } = await import('../src/modules/notifications/notifications.repository');
  const { webhooksRepository } = await import('../src/modules/webhooks/webhooks.repository');
  const audit = await import('../src/lib/audit');
  const email = await import('../src/lib/email');

  const increments: Array<{ goalId: string; amount: number }> = [];
  let insertedRec: Record<string, unknown> | null = null;

  virtualAccountsRepository.findByAccountNumber = async () => ({
    id: 'va_123',
    goal_id: 'goal_123',
    organization_id: 'org_123',
    provider_reference: 'nomba_va_123',
  });
  transactionsRepository.insert = async (data: Record<string, unknown>) => ({ id: data.id, ...data });
  contributorsRepository.findByGoalAndNormalizedName = async () => null;
  contributorsRepository.insertAutoDetected = async (data: Record<string, unknown>) => ({ id: data.id, ...data });
  goalsRepository.incrementAmount = async (goalId: string, amount: number) => {
    increments.push({ goalId, amount });
    return { id: goalId };
  };
  goalsRepository.findCompletionState = async () => ({
    id: 'goal_123',
    user_id: 'usr_123',
    organization_id: 'org_123',
    title: 'School fees',
    current_amount: 0,
    target_amount: 250,
    status: 'active',
    slug: 'school-fees',
  });
  goalsRepository.findOwnerByGoalId = async () => ({
    user_id: 'usr_123',
    email: 'owner@test.com',
    title: 'School fees',
  });
  reconciliationRepository.insert = async (data: Record<string, unknown>) => {
    insertedRec = { id: data.id, ...data };
    return insertedRec;
  };
  webhooksRepository.markStatus = async () => ({ id: 'wh_123' });
  notificationsRepository.insert = async (data: Record<string, unknown>) => ({ id: data.id, ...data });
  audit.logAudit = async () => undefined;
  email.sendPaymentReceivedEmail = async () => undefined;
  email.sendEmail = async () => undefined;
  email.paymentMismatchEmail = () => ({ subject: 'Over', html: '<p>Over</p>' });

  const result = await reconciliationService.reconcilePayment({
    id: 'pay_over',
    provider_reference: 'session_over',
    account_number: '9391076543',
    amount: 300,
    payer_name: 'Ada',
    reference: 'TFgoal123',
    status: 'verified',
  });

  assert.equal(result.matched, true);
  assert.equal(result.payment_match, 'over');
  assert.equal(result.excess_amount, 50);
  assert.deepEqual(increments, [{ goalId: 'goal_123', amount: 300 }]);
  assert.equal(insertedRec?.status, 'pending');
  assert.match(String(insertedRec?.notes), /excess ₦50/);
});
