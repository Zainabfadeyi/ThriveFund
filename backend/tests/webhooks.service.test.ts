import test from 'node:test';
import assert from 'node:assert/strict';
import { PaymentProviderName } from '../src/shared/types/enums';
import { setTestEnv } from './helpers';

setTestEnv();

test('webhooksService rejects invalid Nomba signatures before persisting', async () => {
  const { webhooksService } = await import('../src/modules/webhooks/webhooks.service');
  const paymentProvider = await import('../src/providers/payment');
  const { webhooksRepository } = await import('../src/modules/webhooks/webhooks.repository');

  paymentProvider.getPaymentProvider = () => ({
    name: PaymentProviderName.Nomba,
    validateWebhookSignature: () => false,
    createVirtualAccount: async () => { throw new Error('unused'); },
    verifyPayment: async () => { throw new Error('unused'); },
    transferToBank: async () => { throw new Error('unused'); },
    expireVirtualAccount: async () => { throw new Error('unused'); },
    listBanks: async () => [],
    lookupBankAccount: async () => { throw new Error('unused'); },
    healthCheck: async () => ({ status: 'ok' }),
    listBankTransactions: async () => ({ rows: [] }),
    getAccountBalance: async () => 0,
  });
  webhooksRepository.insertEvent = async () => {
    throw new Error('webhook should not be persisted');
  };

  await assert.rejects(
    () => webhooksService.processNomba('{}', 'bad_signature', {}, '2026-07-02T08:00:00.000Z'),
    (err: unknown) => {
      const error = err as { statusCode?: number; code?: string };
      assert.equal(error.statusCode, 401);
      assert.equal(error.code, 'UNAUTHORIZED');
      return true;
    },
  );
});

test('webhooksService stores, verifies, and reconciles payment_success events', async () => {
  const { webhooksService } = await import('../src/modules/webhooks/webhooks.service');
  const paymentProvider = await import('../src/providers/payment');
  const { webhooksRepository } = await import('../src/modules/webhooks/webhooks.repository');
  const { paymentsService } = await import('../src/modules/payments/payments.service');
  const { reconciliationService } = await import('../src/modules/reconciliation/reconciliation.service');
  const audit = await import('../src/lib/audit');

  paymentProvider.getPaymentProvider = () => ({
    name: PaymentProviderName.Nomba,
    validateWebhookSignature: () => true,
    createVirtualAccount: async () => { throw new Error('unused'); },
    verifyPayment: async () => { throw new Error('unused'); },
    transferToBank: async () => { throw new Error('unused'); },
    expireVirtualAccount: async () => { throw new Error('unused'); },
    listBanks: async () => [],
    lookupBankAccount: async () => { throw new Error('unused'); },
    healthCheck: async () => ({ status: 'ok' }),
    listBankTransactions: async () => ({ rows: [] }),
    getAccountBalance: async () => 0,
  });
  webhooksRepository.insertEvent = async (data: Record<string, unknown>) => ({ id: 'wh_123', ...data });
  webhooksRepository.findByRequestId = async () => null;
  webhooksRepository.markFailed = async () => ({ id: 'wh_123' });
  audit.logAudit = async () => undefined;
  paymentsService.ingestFromWebhook = async (_eventId, payload) => ({
    duplicate: false,
    payment: {
      id: 'pay_123',
      provider_reference: payload.providerReference,
      account_number: payload.accountNumber,
      amount: payload.amount,
      payer_name: payload.payerName ?? 'Anonymous',
      reference: payload.reference,
      status: 'verified',
      paid_at: payload.paidAt,
    },
  });
  reconciliationService.reconcilePayment = async () => ({
    matched: true,
    transaction_id: 'txn_123',
    reconciliation: { id: 'rec_123' },
  });

  const result = await webhooksService.processNomba(
    '{"event_type":"payment_success"}',
    'good_signature',
    {
      event_type: 'payment_success',
      data: {
        transactionId: 'session_123',
        bankAccountNumber: '9391076543',
        amount: '5000',
        senderName: 'Ada',
        accountRef: 'TFgoal123',
      },
    },
    '2026-07-02T08:00:00.000Z',
  );

  assert.deepEqual(result, {
    received: true,
    matched: true,
    transaction_id: 'txn_123',
    reconciliation_id: 'rec_123',
    duplicate: undefined,
  });
});

test('webhooksService normalizes live-shaped Nomba transfer payloads', async () => {
  const { webhooksService } = await import('../src/modules/webhooks/webhooks.service');
  const paymentProvider = await import('../src/providers/payment');
  const { webhooksRepository } = await import('../src/modules/webhooks/webhooks.repository');
  const { paymentsService } = await import('../src/modules/payments/payments.service');
  const { reconciliationService } = await import('../src/modules/reconciliation/reconciliation.service');
  const audit = await import('../src/lib/audit');

  let capturedPayload: Record<string, unknown> | undefined;
  paymentProvider.getPaymentProvider = () => ({
    name: PaymentProviderName.Nomba,
    validateWebhookSignature: () => true,
    createVirtualAccount: async () => { throw new Error('unused'); },
    verifyPayment: async () => { throw new Error('unused'); },
    transferToBank: async () => { throw new Error('unused'); },
    expireVirtualAccount: async () => { throw new Error('unused'); },
    listBanks: async () => [],
    lookupBankAccount: async () => { throw new Error('unused'); },
    healthCheck: async () => ({ status: 'ok' }),
    listBankTransactions: async () => ({ rows: [] }),
    getAccountBalance: async () => 0,
  });
  webhooksRepository.insertEvent = async (data: Record<string, unknown>) => ({ id: 'wh_123', ...data });
  webhooksRepository.findByRequestId = async () => null;
  webhooksRepository.markFailed = async () => ({ id: 'wh_123' });
  audit.logAudit = async () => undefined;
  paymentsService.ingestFromWebhook = async (_eventId, payload) => {
    capturedPayload = payload;
    return {
      duplicate: false,
      payment: {
        id: 'pay_123',
        provider_reference: payload.providerReference,
        account_number: payload.accountNumber,
        amount: payload.amount,
        payer_name: payload.payerName ?? 'Anonymous',
        reference: payload.reference,
        status: 'verified',
        paid_at: payload.paidAt,
      },
    };
  };
  reconciliationService.reconcilePayment = async () => ({
    matched: true,
    transaction_id: 'txn_123',
    reconciliation: { id: 'rec_123' },
  });

  await webhooksService.processNomba(
    '{"event_type":"payment_success"}',
    'good_signature',
    {
      event_type: 'payment_success',
      requestId: '49e11b44-909b-4f83-82b4-9a83a000000',
      data: {
        merchant: {
          walletId: 'wallet_123',
          userId: 'merchant_123',
        },
        transaction: {
          aliasAccountNumber: '9679130000',
          sessionId: '1000042602061021531516000000',
          type: 'vact_transfer',
          transactionId: 'API-VACT_TRA-merchant-123',
          responseCode: '',
          transactionAmount: 120,
          time: '2026-02-06T10:21:56Z',
          aliasAccountReference: 'TFgoal123',
        },
        customer: {
          senderName: 'JOHN GRASS',
          bankName: 'Paycom Opay',
          accountNumber: '8168900000',
        },
      },
    },
    '2026-02-06T10:21:57Z',
  );

  assert.equal(capturedPayload?.providerReference, '1000042602061021531516000000');
  assert.equal(capturedPayload?.accountNumber, '9679130000');
  assert.equal(capturedPayload?.amount, 120);
  assert.equal(capturedPayload?.payerName, 'JOHN GRASS');
  assert.equal(capturedPayload?.reference, 'TFgoal123');
  assert.equal(capturedPayload?.bankName, 'Paycom Opay');
  assert.equal(capturedPayload?.status, 'successful');
});

test('webhooksService retries reconcile when payment already exists', async () => {
  const { webhooksService } = await import('../src/modules/webhooks/webhooks.service');
  const paymentProvider = await import('../src/providers/payment');
  const { webhooksRepository } = await import('../src/modules/webhooks/webhooks.repository');
  const { paymentsService } = await import('../src/modules/payments/payments.service');
  const { reconciliationService } = await import('../src/modules/reconciliation/reconciliation.service');
  const audit = await import('../src/lib/audit');

  let reconcileCalled = false;
  paymentProvider.getPaymentProvider = () => ({
    name: PaymentProviderName.Nomba,
    validateWebhookSignature: () => true,
    createVirtualAccount: async () => { throw new Error('unused'); },
    verifyPayment: async () => { throw new Error('unused'); },
    transferToBank: async () => { throw new Error('unused'); },
    expireVirtualAccount: async () => { throw new Error('unused'); },
    listBanks: async () => [],
    lookupBankAccount: async () => { throw new Error('unused'); },
    healthCheck: async () => ({ status: 'ok' }),
    listBankTransactions: async () => ({ rows: [] }),
    getAccountBalance: async () => 0,
  });
  webhooksRepository.insertEvent = async (data: Record<string, unknown>) => ({ id: 'wh_123', ...data });
  webhooksRepository.findByRequestId = async () => ({ id: 'wh_existing' });
  webhooksRepository.markFailed = async () => ({ id: 'wh_123' });
  audit.logAudit = async () => undefined;
  paymentsService.ingestFromWebhook = async (_eventId, payload) => ({
    duplicate: true,
    payment: {
      id: 'pay_123',
      provider_reference: payload.providerReference,
      account_number: payload.accountNumber,
      amount: payload.amount,
      payer_name: payload.payerName ?? 'Anonymous',
      reference: payload.reference,
      status: 'verified',
      paid_at: payload.paidAt,
    },
  });
  reconciliationService.reconcilePayment = async () => {
    reconcileCalled = true;
    return {
      matched: true,
      transaction_id: 'txn_123',
      reconciliation: { id: 'rec_123' },
    };
  };

  const result = await webhooksService.processNomba(
    '{"event_type":"payment_success"}',
    '',
    {
      event_type: 'payment_success',
      requestId: '49e11b44-909b-4f83-82b4-9a83a000000',
      data: {
        transactionId: 'session_123',
        bankAccountNumber: '9391076543',
        amount: '5000',
        senderName: 'Ada',
        accountRef: 'TFgoal123',
      },
    },
    undefined,
    { skipSignature: true, retry: true },
  );

  assert.equal(reconcileCalled, true);
  assert.deepEqual(result, {
    received: true,
    matched: true,
    transaction_id: 'txn_123',
    reconciliation_id: 'rec_123',
    duplicate: true,
  });
});
