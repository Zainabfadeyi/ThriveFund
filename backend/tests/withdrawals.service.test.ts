import test from 'node:test';
import assert from 'node:assert/strict';
import { setTestEnv } from './helpers';

setTestEnv();

test('withdrawalsService does not email on ambiguous transfer errors', async () => {
  const { withdrawalsService } = await import('../src/modules/withdrawals/withdrawals.service');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');
  const { payoutAccountsRepository } = await import('../src/modules/payout-accounts/payout-accounts.repository');
  const { withdrawalsRepository } = await import('../src/modules/withdrawals/withdrawals.repository');
  const paymentProvider = await import('../src/providers/payment');
  const audit = await import('../src/lib/audit');

  let emailed = false;
  const originalEmailOwner = withdrawalsService.emailOwner.bind(withdrawalsService);
  withdrawalsService.emailOwner = async (...args) => {
    if (args[1] === 'failed') emailed = true;
    return originalEmailOwner(...args);
  };

  goalsRepository.findByIdRaw = async () => ({
    id: 'goal_123',
    user_id: 'usr_123',
    organization_id: 'org_123',
    title: 'School fees',
    status: 'completed',
    current_amount: 5000,
  });
  goalsRepository.findOwnerByGoalId = async () => ({ email: 'owner@test.com' });
  payoutAccountsRepository.findByIdForUser = async () => ({
    id: 'pa_123',
    account_number: '0123456789',
    account_name: 'Owner',
    bank_code: '058',
    bank_name: 'GTBank',
  });
  withdrawalsRepository.insert = async (data) => ({
    id: data.id,
    goal_id: data.goal_id,
    user_id: data.user_id,
    amount: data.amount,
    status: 'pending',
  });
  withdrawalsRepository.sumReservedByGoal = async () => 0;
  withdrawalsRepository.sumPendingWalletCommitment = async () => ({ amount: 0, count: 0 });
  withdrawalsRepository.markProcessing = async (id, providerReference) => ({
    id,
    status: 'processing',
    provider_reference: providerReference,
  });
  audit.logAudit = async () => undefined;

  paymentProvider.getPaymentProvider = () => ({
    name: 'nomba',
    getAccountBalance: async () => 10000,
    lookupBankAccount: async () => ({
      accountNumber: '0123456789',
      accountName: 'Owner',
      bankCode: '058',
    }),
    transferToBank: async () => {
      throw Object.assign(new Error('fetch failed'), { details: {} });
    },
    validateWebhookSignature: () => true,
    createVirtualAccount: async () => { throw new Error('unused'); },
    verifyPayment: async () => { throw new Error('unused'); },
    expireVirtualAccount: async () => { throw new Error('unused'); },
    listBanks: async () => [],
    healthCheck: async () => ({ status: 'ok' }),
    listBankTransactions: async () => ({ rows: [] }),
  });

  const result = await withdrawalsService.createForGoal('usr_123', 'goal_123', {
    payout_account_id: 'pa_123',
  });

  assert.equal(result.withdrawal.status, 'processing');
  assert.equal(emailed, false);
});

test('withdrawalsService emails only once on terminal webhook failure', async () => {
  const { withdrawalsService } = await import('../src/modules/withdrawals/withdrawals.service');
  const { goalsRepository } = await import('../src/modules/goals/goals.repository');
  const { payoutAccountsRepository } = await import('../src/modules/payout-accounts/payout-accounts.repository');
  const { withdrawalsRepository } = await import('../src/modules/withdrawals/withdrawals.repository');

  let failedEmails = 0;
  withdrawalsService.emailOwner = async (_email, status) => {
    if (status === 'failed') failedEmails += 1;
  };

  const withdrawal = {
    id: 'wd_abc123def456',
    goal_id: 'goal_123',
    user_id: 'usr_123',
    payout_account_id: 'pa_123',
    amount: 5000,
    status: 'processing',
    provider_reference: 'API-TRANSFER-123',
  };

  withdrawalsRepository.findOpenByMerchantTxRef = async () => withdrawal;
  withdrawalsRepository.findByProviderReference = async () => withdrawal;
  withdrawalsRepository.markFailed = async () => ({
    row: { ...withdrawal, status: 'failed' },
    transitioned: false,
  });
  goalsRepository.findByIdRaw = async () => ({
    id: 'goal_123',
    user_id: 'usr_123',
    title: 'School fees',
    organization_id: null,
  });
  payoutAccountsRepository.findByIdForUser = async () => ({
    id: 'pa_123',
    account_number: '0123456789',
    account_name: 'Owner',
    bank_name: 'GTBank',
  });
  goalsRepository.findOwnerByGoalId = async () => ({ email: 'owner@test.com' });

  await withdrawalsService.reconcileFromWebhook({
    event: 'transfer_failed',
    merchantTxRef: 'TF-WD-wdabc123def456',
    providerReference: 'API-TRANSFER-123',
  });

  assert.equal(failedEmails, 0);
});

test('withdrawalsService does not downgrade successful payout after failed provider update', async () => {
  const { withdrawalsService } = await import('../src/modules/withdrawals/withdrawals.service');
  const { withdrawalsRepository } = await import('../src/modules/withdrawals/withdrawals.repository');

  let markedFailed = false;
  withdrawalsRepository.findById = async () => ({
    id: 'wd_success',
    status: 'successful',
    provider_reference: 'API-TRANSFER-SUCCESS',
  });
  withdrawalsRepository.markFailed = async () => {
    markedFailed = true;
    return { row: { id: 'wd_success', status: 'failed' }, transitioned: true };
  };

  const result = await withdrawalsService.applyTransferResult({
    withdrawalId: 'wd_success',
    goalId: 'goal_123',
    userId: 'usr_123',
    goalTitle: 'School fees',
    amount: 5000,
    account: {},
    transfer: {
      status: 'failed',
      providerReference: 'API-TRANSFER-FAILED',
    },
  });

  assert.equal(result?.status, 'successful');
  assert.equal(markedFailed, false);
});
