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
  const { notificationsRepository } = await import('../src/modules/notifications/notifications.repository');
  const { webhooksRepository } = await import('../src/modules/webhooks/webhooks.repository');
  const audit = await import('../src/lib/audit');
  const email = await import('../src/lib/email');

  const transactions: Record<string, unknown>[] = [];
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
  goalsRepository.incrementAmount = async (goalId: string, amount: number) => {
    increments.push({ goalId, amount });
    return { id: goalId };
  };
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
  assert.deepEqual(increments, [{ goalId: 'goal_123', amount: 5000 }]);
});
