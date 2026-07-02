import test from 'node:test';
import assert from 'node:assert/strict';
import { PaymentProviderName } from '../src/shared/types/enums';
import { setTestEnv } from './helpers';

setTestEnv();

test('paymentsService marks duplicate webhook payments without reinserting', async () => {
  const { paymentsService } = await import('../src/modules/payments/payments.service');
  const { paymentsRepository } = await import('../src/modules/payments/payments.repository');
  const { webhooksRepository } = await import('../src/modules/webhooks/webhooks.repository');

  const marked: string[] = [];
  paymentsRepository.findByProviderReference = async () => ({ id: 'pay_existing' });
  paymentsRepository.insert = async () => {
    throw new Error('insert should not be called for duplicates');
  };
  webhooksRepository.markStatus = async (_ref: string, status: string) => {
    marked.push(status);
    return { id: 'wh_123' };
  };

  const result = await paymentsService.ingestFromWebhook('wh_123', {
    event: 'payment_success',
    providerReference: 'session_123',
    accountNumber: '9391076543',
    amount: 5000,
    currency: 'NGN',
    reference: 'TFgoal123',
    status: 'successful',
    paidAt: new Date().toISOString(),
  });

  assert.equal(result.duplicate, true);
  assert.deepEqual(marked, ['duplicate']);
});

test('paymentsService verifies and stores successful provider payments', async () => {
  const { paymentsService } = await import('../src/modules/payments/payments.service');
  const { paymentsRepository } = await import('../src/modules/payments/payments.repository');
  const paymentProvider = await import('../src/providers/payment');
  const audit = await import('../src/lib/audit');

  paymentsRepository.findByProviderReference = async () => null;
  paymentsRepository.insert = async (data: Record<string, unknown>) => ({ id: data.id, ...data });
  paymentProvider.getPaymentProvider = () => ({
    name: PaymentProviderName.Nomba,
    verifyPayment: async (payload) => ({
      provider: PaymentProviderName.Nomba,
      providerReference: payload.providerReference,
      accountNumber: payload.accountNumber,
      amount: payload.amount,
      currency: payload.currency,
      payerName: payload.payerName ?? 'Anonymous',
      reference: payload.reference,
      status: 'successful',
      paidAt: new Date(payload.paidAt),
      bankName: payload.bankName,
    }),
    createVirtualAccount: async () => { throw new Error('unused'); },
    transferToBank: async () => { throw new Error('unused'); },
    expireVirtualAccount: async () => { throw new Error('unused'); },
    listBanks: async () => [],
    lookupBankAccount: async () => { throw new Error('unused'); },
    validateWebhookSignature: () => true,
    healthCheck: async () => ({ status: 'ok' }),
    listBankTransactions: async () => ({ rows: [] }),
    getAccountBalance: async () => 0,
  });
  audit.logAudit = async () => undefined;

  const result = await paymentsService.ingestFromWebhook('wh_123', {
    event: 'payment_success',
    providerReference: 'session_123',
    accountNumber: '9391076543',
    amount: 5000,
    currency: 'NGN',
    payerName: 'Ada',
    reference: 'TFgoal123',
    status: 'successful',
    paidAt: '2026-07-02T08:00:00.000Z',
  });

  assert.equal(result.duplicate, false);
  assert.equal(result.payment.status, 'verified');
  assert.equal(result.payment.provider_reference, 'session_123');
});
