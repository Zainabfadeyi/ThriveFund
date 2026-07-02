import test from 'node:test';
import assert from 'node:assert/strict';
import { setTestEnv, jsonResponse } from './helpers';

setTestEnv();

test('NombaProvider sanitizes virtual account payload and maps successful bank details', async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  (globalThis as unknown as { fetch: typeof fetch }).fetch = async (url, init) => {
    calls.push({ url: String(url), init: init ?? {} });
    if (String(url).endsWith('/v1/auth/token/issue')) {
      return jsonResponse({ data: { access_token: 'token_123' } });
    }

    return jsonResponse({
      code: '00',
      description: 'Success',
      data: {
        accountHolderId: 'holder_123',
        accountRef: JSON.parse(String(init?.body)).accountRef,
        bankName: 'Nombank MFB',
        bankAccountNumber: '9391076543',
        bankAccountName: 'Nomba Test User',
      },
    });
  };

  const { NombaProvider } = await import('../src/providers/payment/nomba.provider');
  const provider = new NombaProvider();

  const result = await provider.createVirtualAccount({
    reference: 'goal_fd454da80abf',
    accountName: 'ThriveFund / School Fees!!!',
  });

  assert.equal(result.accountNumber, '9391076543');
  assert.equal(result.accountName, 'Nomba Test User');
  assert.equal(result.bankName, 'Nombank MFB');

  const createCall = calls.find((call) => call.url.includes('/v1/accounts/virtual/'));
  assert.ok(createCall);
  const requestBody = JSON.parse(String(createCall.init.body));
  assert.match(requestBody.accountRef, /^TF[a-zA-Z0-9]{16,62}$/);
  assert.equal(requestBody.accountRef.includes('_'), false);
  assert.equal(requestBody.accountRef.includes('-'), false);
  assert.equal(requestBody.accountRef, 'TFgoalfd454da80abf20a80f1f10bd');
  assert.equal(requestBody.accountName, 'ThriveFund School Fees');
});

test('NombaProvider maps bank list when data is a direct array', async () => {
  (globalThis as unknown as { fetch: typeof fetch }).fetch = async (url) => {
    if (String(url).endsWith('/v1/auth/token/issue')) {
      return jsonResponse({ data: { access_token: 'token_123' } });
    }

    return jsonResponse({
      code: '00',
      description: 'Success',
      data: [
        { code: '058', name: 'Guaranty Trust Bank' },
        { code: '011', name: 'First Bank of Nigeria' },
      ],
    });
  };

  const { NombaProvider } = await import('../src/providers/payment/nomba.provider');
  const provider = new NombaProvider();

  const banks = await provider.listBanks();
  assert.equal(banks.length, 2);
  assert.equal(banks[0]?.code, '058');
  assert.equal(banks[1]?.name, 'First Bank of Nigeria');
});

test('NombaProvider treats provider-level validation errors as provider failures', async () => {
  (globalThis as unknown as { fetch: typeof fetch }).fetch = async (url, init) => {
    if (String(url).endsWith('/v1/auth/token/issue')) {
      return jsonResponse({ data: { access_token: 'token_123' } });
    }

    return jsonResponse({
      code: '400',
      description: 'Validation Error',
      message: 'Validation Error',
      status: false,
    });
  };

  const { NombaProvider } = await import('../src/providers/payment/nomba.provider');
  const provider = new NombaProvider();

  await assert.rejects(
    () => provider.createVirtualAccount({
      reference: 'goal_fd454da80abf',
      accountName: 'ThriveFund / School Fees',
    }),
    (err: unknown) => {
      const error = err as { statusCode?: number; code?: string; message?: string; details?: Record<string, unknown> };
      assert.equal(error.statusCode, 502);
      assert.equal(error.code, 'PROVIDER_ERROR');
      assert.equal(error.message, 'Validation Error');
      assert.equal(error.details?.providerCode, '400');
      assert.equal(error.details?.providerStatus, false);
      assert.deepEqual(error.details?.responseKeys, ['code', 'description', 'message', 'status']);
      assert.ok(error.details?.requestBody);
      return true;
    },
  );
});
