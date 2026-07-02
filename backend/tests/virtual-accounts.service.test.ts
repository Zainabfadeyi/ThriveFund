import test from 'node:test';
import assert from 'node:assert/strict';
import { PaymentProviderName } from '../src/shared/types/enums';
import { setTestEnv } from './helpers';

setTestEnv();

test('virtualAccountsService creates a provider account and persists organization_id', async () => {
  const { virtualAccountsService } = await import('../src/modules/virtual-accounts/virtual-accounts.service');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');
  const { virtualAccountsRepository } = await import('../src/modules/virtual-accounts/virtual-accounts.repository');
  const paymentProvider = await import('../src/providers/payment');
  const audit = await import('../src/lib/audit');

  const inserted: Record<string, unknown>[] = [];

  goalsRepository.findByIdRaw = async () => ({
    id: 'goal_123',
    user_id: 'usr_123',
    title: 'School Fees',
    organization_id: 'org_123',
  });
  virtualAccountsRepository.findActiveByGoalId = async () => null;
  virtualAccountsRepository.insert = async (data: Record<string, unknown>) => {
    inserted.push(data);
    return { id: data.id, ...data };
  };
  paymentProvider.getPaymentProvider = () => ({
    name: PaymentProviderName.Nomba,
    createVirtualAccount: async () => ({
      provider: PaymentProviderName.Nomba,
      providerAccountId: 'holder_123',
      accountNumber: '9391076543',
      accountName: 'Nomba Test User',
      bankName: 'Nombank MFB',
      providerReference: 'TFgoal123',
    }),
    verifyPayment: async () => { throw new Error('unused'); },
    transferToBank: async () => { throw new Error('unused'); },
    expireVirtualAccount: async () => { throw new Error('unused'); },
    listBanks: async () => [],
    lookupBankAccount: async () => { throw new Error('unused'); },
    validateWebhookSignature: () => true,
    healthCheck: async () => ({ status: 'ok' }),
    listBankTransactions: async () => ({ rows: [] }),
  });
  audit.logAudit = async () => undefined;

  const result = await virtualAccountsService.createForGoal('usr_123', 'goal_123', {});

  assert.equal(result.account_number, '9391076543');
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].organization_id, 'org_123');
  assert.equal(inserted[0].goal_id, 'goal_123');
});

test('virtualAccountsService blocks duplicate active virtual accounts', async () => {
  const { virtualAccountsService } = await import('../src/modules/virtual-accounts/virtual-accounts.service');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');
  const { virtualAccountsRepository } = await import('../src/modules/virtual-accounts/virtual-accounts.repository');

  goalsRepository.findByIdRaw = async () => ({
    id: 'goal_123',
    user_id: 'usr_123',
    title: 'School Fees',
  });
  virtualAccountsRepository.findActiveByGoalId = async () => ({ id: 'va_existing' });

  await assert.rejects(
    () => virtualAccountsService.createForGoal('usr_123', 'goal_123', {}),
    (err: unknown) => {
      const error = err as { statusCode?: number; code?: string; message?: string };
      assert.equal(error.statusCode, 409);
      assert.equal(error.code, 'CONFLICT');
      assert.equal(error.message, 'A virtual account already exists for this goal');
      return true;
    },
  );
});
