import test from 'node:test';
import assert from 'node:assert/strict';
import { setTestEnv } from './helpers';

setTestEnv();

test('reconciliationService skips duplicate provider references idempotently', async () => {
  const { reconciliationService } = await import('../src/modules/reconciliation/reconciliation.service');
  const { virtualAccountsRepository } = await import('../src/modules/virtual-accounts/virtual-accounts.repository');
  const { transactionsRepository } = await import('../src/modules/transactions/transactions.repository');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');

  let insertCalls = 0;
  virtualAccountsRepository.findByAccountNumber = async () => ({
    id: 'va_123',
    goal_id: 'goal_123',
  });
  transactionsRepository.findByProviderReference = async () => ({
    id: 'txn_existing',
    goal_id: 'goal_123',
  });
  transactionsRepository.insert = async () => {
    insertCalls += 1;
    return { id: 'txn_new' };
  };
  goalsRepository.findCompletionState = async () => ({
    id: 'goal_123',
    status: 'active',
    current_amount: 5000,
    target_amount: 10000,
  });

  const result = await reconciliationService.reconcilePayment({
    id: 'pay_dup',
    provider_reference: 'session_dup',
    account_number: '9391076543',
    amount: 5000,
    payer_name: 'Ada',
    reference: 'TFgoal123',
    status: 'verified',
  });

  assert.equal(result.matched, true);
  assert.equal(result.duplicate, true);
  assert.equal(result.transaction_id, 'txn_existing');
  assert.equal(insertCalls, 0);
});

test('completeCampaignIfTargetReached only runs side effects once when claim fails', async () => {
  const { reconciliationService } = await import('../src/modules/reconciliation/reconciliation.service');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');
  const { collectionLifecycleService } = await import('../src/modules/goals/collection-lifecycle.service');
  const { notificationsRepository } = await import('../src/modules/notifications/notifications.repository');

  let notifyCount = 0;
  goalsRepository.findCompletionState = async () => ({
    id: 'goal_123',
    user_id: 'usr_123',
    organization_id: 'org_123',
    title: 'School fees',
    current_amount: 12000,
    target_amount: 10000,
    status: 'active',
    email: 'owner@test.com',
  });
  collectionLifecycleService.completeAtTarget = async () => ({
    updatedGoal: null,
    expiryResult: null,
    graceDays: 0,
    claimed: false,
  });
  notificationsRepository.insert = async () => {
    notifyCount += 1;
    return { id: 'ntf_123' };
  };

  const result = await reconciliationService.completeCampaignIfTargetReached('goal_123', {
    id: 'va_123',
    provider_reference: 'nomba_va_123',
  });

  assert.equal(result, null);
  assert.equal(notifyCount, 0);
});
