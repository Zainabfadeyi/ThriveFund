import crypto from 'crypto';
import { env } from '../../config/env';
import { Errors } from '../../lib/errors';
import { fromKobo, normalizeNombaTransactionAmount, toKobo } from '../../lib/money';
import { logNombaCall } from '../../lib/nomba-logger';
import { PaymentProviderName } from '../../shared/types/enums';
import type {
  CreateVirtualAccountRequest,
  BankTransferRequest,
  BankTransferResult,
  ExpireVirtualAccountResult,
  Bank,
  BankAccountLookupResult,
  NombaBankTransaction,
  PaymentProvider,
  PaymentWebhookPayload,
  VerifiedPayment,
  VirtualAccountResult,
} from './payment-provider.interface';

type NombaToken = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

type NombaResponse<T> = {
  code?: string;
  responseCode?: string;
  description?: string;
  responseMessage?: string;
  message?: string;
  status?: string | boolean;
  data?: T;
};

type NombaErrorDetails = {
  provider: PaymentProviderName.Nomba;
  environment: typeof env.NOMBA_ENVIRONMENT;
  scope: typeof env.NOMBA_VIRTUAL_ACCOUNT_SCOPE;
  method: string;
  path: string;
  status?: number;
  providerCode?: string;
  providerMessage?: string;
  providerStatus?: string | boolean;
  requestBody?: Record<string, unknown>;
  responseKeys?: string[];
  dataKeys?: string[];
};

type NombaVirtualAccount = {
  accountId?: string;
  id?: string;
  accountHolderId?: string;
  accountRef?: string;
  accountName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  accountNumber?: string;
  virtualAccountNumber?: string;
  nuban?: string;
  account?: NombaVirtualAccount;
  virtualAccount?: NombaVirtualAccount;
  banks?: Array<{
    bankName?: string;
    bankAccountNumber?: string;
    accountNumber?: string;
    accountName?: string;
    bankAccountName?: string;
    nuban?: string;
  }>;
  bank?: {
    name?: string;
    bankName?: string;
    accountNumber?: string;
    bankAccountNumber?: string;
    accountName?: string;
    bankAccountName?: string;
  };
};

type NombaBankTransfer = {
  id?: string;
  status?: string;
  amount?: string | number;
  fee?: number;
};

type NombaExpireVirtualAccount = {
  expired?: boolean;
};

type NombaBank = { code?: string; name?: string };

type NombaBanksList = {
  results?: NombaBank[];
};

type NombaBankTransactionRow = {
  amount?: number | string;
  status?: string;
  transactionType?: string;
  timeUpdated?: string;
  meta?: {
    transactionId?: string;
    merchantTxRef?: string;
    transactionAmount?: number | string;
  };
};

type NombaBankLookup = {
  accountNumber?: string;
  accountName?: string;
  account_number?: string;
  account_name?: string;
};

type NombaBankTransactionsList = {
  results?: NombaBankTransactionRow[];
  cursor?: string;
};

function unwrapNombaBanks(payload: unknown): NombaBank[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.results)) return obj.results as NombaBank[];
  if (obj.data !== undefined) return unwrapNombaBanks(obj.data);

  return [];
}

type NombaWebhookPayload = {
  event_type?: string;
  eventType?: string;
  requestId?: string;
  request_id?: string;
  data?: {
    merchant?: {
      userId?: string;
      walletId?: string;
    };
    transaction?: {
      transactionId?: string;
      type?: string;
      time?: string;
      responseCode?: string | null;
    };
  };
};

const DEFAULT_BASE_URLS = {
  sandbox: 'https://sandbox.nomba.com',
  production: 'https://api.nomba.com',
} as const;

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) throw Errors.provider(`Missing ${name} for Nomba integration`);
  return value;
}

function nombaBaseUrl(): string {
  return (env.NOMBA_BASE_URL ?? DEFAULT_BASE_URLS[env.NOMBA_ENVIRONMENT]).replace(/\/+$/, '');
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function nombaMessage(json: NombaResponse<unknown>): string | undefined {
  return (
    asString(json.description) ??
    asString(json.responseMessage) ??
    asString(json.message)
  );
}

function nombaCode(json: NombaResponse<unknown>): string | undefined {
  return asString(json.code) ?? asString(json.responseCode);
}

function nombaSucceeded(json: NombaResponse<unknown>): boolean | undefined {
  const code = nombaCode(json)?.toLowerCase();
  if (code) return ['00', '0', 'success', 'successful'].includes(code);

  if (typeof json.status === 'boolean') return json.status;
  const status = asString(json.status)?.toLowerCase();
  if (status) return ['true', 'success', 'successful', 'ok'].includes(status);

  return undefined;
}

function responseKeys(value: unknown): string[] | undefined {
  if (!value || typeof value !== 'object') return undefined;
  return Object.keys(value as Record<string, unknown>).slice(0, 20);
}

function mapStatus(status: string): VerifiedPayment['status'] {
  const normalized = status.toLowerCase();
  if (['success', 'successful', 'completed', 'paid'].includes(normalized)) return 'successful';
  if (['pending', 'processing'].includes(normalized)) return 'pending';
  return 'failed';
}

function buildAccountRef(reference: string): string {
  const cleaned = reference.replace(/[^a-zA-Z0-9]/g, '').slice(0, 48);
  const hash = crypto.createHash('sha256').update(reference).digest('hex').slice(0, 12);
  return `TF${cleaned || 'ref'}${hash}`.slice(0, 64);
}

function buildAccountName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const fallback = 'ThriveFund Customer';
  const accountName = (cleaned || fallback).slice(0, 64).trim();
  return accountName.length >= 8 ? accountName : fallback;
}

function unwrapVirtualAccount(response: NombaResponse<NombaVirtualAccount> & NombaVirtualAccount): NombaVirtualAccount {
  const data = response.data ?? response;
  return data.account ?? data.virtualAccount ?? data;
}

function providerAccountId(account: NombaVirtualAccount, fallback: string): string {
  return account.accountId ?? account.id ?? account.accountHolderId ?? fallback;
}

function transferStatus(status: string | undefined): BankTransferResult['status'] {
  const normalized = (status ?? '').toLowerCase();
  if (['success', 'successful', 'completed', 'paid'].includes(normalized)) return 'successful';
  if (
    ['processing', 'pending', 'pending_billing', 'new', 'cancelled', 'payment_failed', 'reversed_by_vendor'].includes(
      normalized,
    )
  ) {
    return 'processing';
  }
  if (['refund', 'failed', 'failure'].includes(normalized)) return 'failed';
  return 'failed';
}

function resolveTransferStatus(response: NombaResponse<NombaBankTransfer> & NombaBankTransfer): BankTransferResult['status'] {
  const transfer = response.data ?? response;
  const mapped = transferStatus(transfer.status);
  if (mapped !== 'failed') return mapped;

  const code = nombaCode(response)?.toLowerCase();
  if (code === '201') return 'processing';
  if (code === '00' && transfer.id) return 'processing';

  return 'failed';
}

function safeWebhookValue(value: unknown): string {
  if (value === null || value === undefined || value === 'null') return '';
  return String(value);
}

function buildWebhookSignaturePayload(rawBody: string, timestamp: string): string {
  const payload = JSON.parse(rawBody) as NombaWebhookPayload;
  const merchant = payload.data?.merchant ?? {};
  const transaction = payload.data?.transaction ?? {};

  return [
    payload.event_type ?? payload.eventType ?? '',
    payload.requestId ?? payload.request_id ?? '',
    merchant.userId ?? '',
    merchant.walletId ?? '',
    transaction.transactionId ?? '',
    transaction.type ?? '',
    transaction.time ?? '',
    safeWebhookValue(transaction.responseCode),
    timestamp,
  ].join(':');
}

export class NombaProvider implements PaymentProvider {
  readonly name = PaymentProviderName.Nomba;

  private token: NombaToken | null = null;
  private readonly baseUrl = nombaBaseUrl();
  private readonly clientId = requiredEnv('NOMBA_CLIENT_ID', env.NOMBA_CLIENT_ID);
  private readonly clientSecret = requiredEnv(
    'NOMBA_PRIVATE_KEY',
    env.NOMBA_PRIVATE_KEY ?? env.NOMBA_CLIENT_SECRET ?? env.NOMBA_API_KEY,
  );
  private readonly parentAccountId = requiredEnv(
    'NOMBA_PARENT_ACCOUNT_ID',
    env.NOMBA_PARENT_ACCOUNT_ID ?? env.NOMBA_ACCOUNT_ID,
  );
  private readonly subAccountId = env.NOMBA_SUB_ACCOUNT_ID;

  async createVirtualAccount(request: CreateVirtualAccountRequest): Promise<VirtualAccountResult> {
    const accountRef = buildAccountRef(request.reference);
    const accountName = buildAccountName(request.accountName);
    const path =
      env.NOMBA_VIRTUAL_ACCOUNT_SCOPE === 'sub_account'
        ? `/v1/accounts/virtual/${encodeURIComponent(requiredEnv('NOMBA_SUB_ACCOUNT_ID', this.subAccountId))}`
        : '/v1/accounts/virtual';
    const body = {
      accountRef,
      accountName,
    };

    const response = await this.request<NombaVirtualAccount>(path, {
      method: 'POST',
      idempotencyKey: accountRef,
      body,
    });

    const account = unwrapVirtualAccount(response);
    const bank = account.banks?.[0];
    const accountNumber =
      account.bankAccountNumber ??
      account.accountNumber ??
      account.virtualAccountNumber ??
      account.nuban ??
      bank?.bankAccountNumber ??
      bank?.accountNumber ??
      bank?.nuban ??
      account.bank?.bankAccountNumber ??
      account.bank?.accountNumber;
    const bankName = account.bankName ?? bank?.bankName ?? account.bank?.bankName ?? account.bank?.name;
    const bankAccountName =
      account.bankAccountName ??
      bank?.bankAccountName ??
      bank?.accountName ??
      account.bank?.bankAccountName ??
      account.bank?.accountName ??
      account.accountName;

    if (!accountNumber || !bankName || !bankAccountName) {
      const providerMessage = nombaMessage(response);
      const message = response.data
        ? `Nomba virtual account response did not include bank details. accountRef=${account.accountRef ?? accountRef}`
        : `Nomba virtual account response did not include a data payload. accountRef=${accountRef}`;

      throw Errors.provider(
        providerMessage ? `${message} Provider message: ${providerMessage}` : message,
        {
          provider: PaymentProviderName.Nomba,
          environment: env.NOMBA_ENVIRONMENT,
          scope: env.NOMBA_VIRTUAL_ACCOUNT_SCOPE,
          method: 'POST',
          path,
          providerCode: nombaCode(response),
          providerMessage,
          providerStatus: response.status,
          requestBody: body,
          dataKeys: responseKeys(response.data),
          responseKeys: responseKeys(account),
        } satisfies NombaErrorDetails,
      );
    }

    return {
      provider: PaymentProviderName.Nomba,
      providerAccountId: providerAccountId(account, this.subAccountId ?? this.parentAccountId),
      accountNumber,
      accountName: bankAccountName,
      bankName,
      providerReference: account.accountRef ?? accountRef,
    };
  }

  async verifyPayment(payload: PaymentWebhookPayload): Promise<VerifiedPayment> {
    if (!payload.providerReference || !payload.accountNumber) {
      throw Errors.validation('Nomba webhook payload is missing transaction or account details');
    }

    return {
      provider: PaymentProviderName.Nomba,
      providerReference: payload.providerReference,
      accountNumber: payload.accountNumber,
      amount: Number(payload.amount),
      currency: payload.currency || 'NGN',
      payerName: payload.payerName ?? 'Anonymous',
      reference: payload.reference || payload.providerReference,
      status: mapStatus(payload.status),
      paidAt: new Date(payload.paidAt || Date.now()),
      bankName: payload.bankName,
    };
  }

  async transferToBank(request: BankTransferRequest): Promise<BankTransferResult> {
    const path =
      env.NOMBA_VIRTUAL_ACCOUNT_SCOPE === 'sub_account'
        ? `/v2/transfers/bank/${encodeURIComponent(requiredEnv('NOMBA_SUB_ACCOUNT_ID', this.subAccountId))}`
        : '/v2/transfers/bank';
    const amountKobo = toKobo(request.amount);
    const response = await this.request<NombaBankTransfer>(path, {
      method: 'POST',
      idempotencyKey: request.merchantTxRef,
      acceptCodes: ['201'],
      merchantTxRef: request.merchantTxRef,
      amountKobo,
      body: {
        amount: amountKobo,
        accountNumber: request.accountNumber,
        accountName: request.accountName,
        bankCode: request.bankCode,
        merchantTxRef: request.merchantTxRef,
        ...(request.senderName ? { senderName: request.senderName } : {}),
        ...(request.narration ? { narration: request.narration } : {}),
      },
    });

    const transfer = response.data ?? response;
    return {
      provider: PaymentProviderName.Nomba,
      providerReference: transfer.id ?? request.merchantTxRef,
      status: resolveTransferStatus(response),
      amount: fromKobo(Number(transfer.amount ?? amountKobo)),
      fee: transfer.fee != null ? fromKobo(Number(transfer.fee)) : undefined,
      raw: response,
    };
  }

  async expireVirtualAccount(identifier: string): Promise<ExpireVirtualAccountResult> {
    const response = await this.request<NombaExpireVirtualAccount>(
      `/v1/accounts/virtual/${encodeURIComponent(identifier)}`,
      { method: 'DELETE' },
    );
    const data = response.data ?? response;
    return {
      provider: PaymentProviderName.Nomba,
      expired: Boolean(data.expired),
      providerReference: identifier,
      raw: response,
    };
  }

  async listBanks(): Promise<Bank[]> {
    const response = await this.request<NombaBanksList | NombaBank[]>('/v1/transfers/banks', {
      method: 'GET',
    });
    const banks = unwrapNombaBanks(response);
    const mapped = banks
      .filter((bank): bank is { code: string; name: string } => Boolean(bank.code && bank.name))
      .map((bank) => ({ code: bank.code, name: bank.name }));

    if (!mapped.length) {
      throw Errors.provider('Nomba bank list response did not include any supported banks', {
        provider: PaymentProviderName.Nomba,
        environment: env.NOMBA_ENVIRONMENT,
        scope: env.NOMBA_VIRTUAL_ACCOUNT_SCOPE,
        method: 'GET',
        path: '/v1/transfers/banks',
        dataKeys: responseKeys(response.data),
        responseKeys: responseKeys(response),
      } satisfies NombaErrorDetails);
    }

    return mapped;
  }

  async lookupBankAccount(accountNumber: string, bankCode: string): Promise<BankAccountLookupResult> {
    const response = await this.request<NombaBankLookup>('/v1/transfers/bank/lookup', {
      method: 'POST',
      body: { accountNumber, bankCode },
    });
    const data = response.data ?? response;
    const resolvedAccountNumber = data.accountNumber ?? data.account_number;
    const resolvedAccountName = data.accountName ?? data.account_name;
    if (!resolvedAccountNumber || !resolvedAccountName) {
      throw Errors.provider('Nomba bank account lookup response did not include account details');
    }
    return {
      accountNumber: resolvedAccountNumber,
      accountName: resolvedAccountName,
      bankCode,
    };
  }

  async listBankTransactions(query: { dateFrom?: string; limit?: number; cursor?: string } = {}) {
    const params = new URLSearchParams();
    if (query.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query.limit) params.set('limit', String(query.limit));
    if (query.cursor) params.set('cursor', query.cursor);
    const qs = params.toString();
    const path = `/v1/transactions/bank${qs ? `?${qs}` : ''}`;

    const response = await this.request<NombaBankTransactionsList>(path, { method: 'GET' });
    const data = response.data ?? response;
    const rows = (data.results ?? []).map((row): NombaBankTransaction => {
      const rawAmount = Number(row.meta?.transactionAmount ?? row.amount ?? 0);
      return {
        providerReference: row.meta?.transactionId ?? '',
        merchantTxRef: row.meta?.merchantTxRef || undefined,
        amountNaira: normalizeNombaTransactionAmount(rawAmount),
        status: row.status ?? 'UNKNOWN',
        transactionType: row.transactionType,
        paidAt: row.timeUpdated,
      };
    }).filter((row) => row.providerReference);

    return { rows, cursor: data.cursor };
  }

  validateWebhookSignature(rawBody: string, signature: string, timestamp?: string): boolean {
    if (!env.NOMBA_WEBHOOK_SECRET || !timestamp) return false;

    try {
      const payloadToHash = buildWebhookSignaturePayload(rawBody, timestamp);
      const expected = crypto
        .createHmac('sha256', env.NOMBA_WEBHOOK_SECRET)
        .update(payloadToHash)
        .digest('base64');
      const provided = signature.trim();
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    } catch {
      return false;
    }
  }

  async getAccountBalance(): Promise<number> {
    const path =
      env.NOMBA_VIRTUAL_ACCOUNT_SCOPE === 'sub_account'
        ? `/v1/accounts/${encodeURIComponent(requiredEnv('NOMBA_SUB_ACCOUNT_ID', this.subAccountId))}/balance`
        : '/v1/accounts/balance';
    const response = await this.request<{ amount?: string | number }>(path, { method: 'GET' });
    const data = response.data ?? response;
    return Number(data.amount ?? 0);
  }

  async healthCheck() {
    try {
      const balance = await this.getAccountBalance();
      return {
        status: 'ok' as const,
        message: `Nomba ${env.NOMBA_ENVIRONMENT} API reachable · balance ₦${balance.toLocaleString()}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nomba health check failed';
      return { status: 'unavailable' as const, message };
    }
  }

  private async request<T>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: Record<string, unknown>;
      skipAuth?: boolean;
      idempotencyKey?: string;
      acceptCodes?: string[];
      merchantTxRef?: string;
      amountKobo?: number;
    },
  ): Promise<NombaResponse<T> & T> {
    const started = Date.now();
    const token = options.skipAuth ? null : await this.getAccessToken();
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          accountId: this.parentAccountId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.idempotencyKey ? { 'X-Idempotent-key': options.idempotencyKey } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (err) {
      logNombaCall({
        method: options.method,
        path,
        merchantTxRef: options.merchantTxRef ?? options.idempotencyKey,
        amountKobo: options.amountKobo,
        latencyMs: Date.now() - started,
        error: err instanceof Error ? err.message : 'Network error',
      });
      throw err;
    }

    const text = await response.text();
    let json: NombaResponse<T> & T;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw Errors.provider('Nomba returned a non-JSON response', {
        provider: PaymentProviderName.Nomba,
        environment: env.NOMBA_ENVIRONMENT,
        scope: env.NOMBA_VIRTUAL_ACCOUNT_SCOPE,
        method: options.method,
        path,
        status: response.status,
      } satisfies NombaErrorDetails);
    }

    if (!response.ok) {
      const providerMessage = nombaMessage(json);
      const message = providerMessage ?? `Nomba request failed with HTTP ${response.status}`;
      logNombaCall({
        method: options.method,
        path,
        merchantTxRef: options.merchantTxRef ?? options.idempotencyKey,
        amountKobo: options.amountKobo,
        status: response.status,
        providerCode: nombaCode(json),
        latencyMs: Date.now() - started,
        error: message,
      });
      throw Errors.provider(message, {
        provider: PaymentProviderName.Nomba,
        environment: env.NOMBA_ENVIRONMENT,
        scope: env.NOMBA_VIRTUAL_ACCOUNT_SCOPE,
        method: options.method,
        path,
        status: response.status,
        providerCode: nombaCode(json),
        providerMessage,
        requestBody: options.body,
        responseKeys: responseKeys(json),
      } satisfies NombaErrorDetails);
    }

    const succeeded = nombaSucceeded(json);
    const acceptedCode = options.acceptCodes?.includes(nombaCode(json) ?? '');
    if (succeeded === false && !acceptedCode) {
      const providerMessage = nombaMessage(json);
      logNombaCall({
        method: options.method,
        path,
        merchantTxRef: options.merchantTxRef ?? options.idempotencyKey,
        amountKobo: options.amountKobo,
        status: response.status,
        providerCode: nombaCode(json),
        latencyMs: Date.now() - started,
        error: providerMessage ?? 'Nomba request was not successful',
      });
      throw Errors.provider(providerMessage ?? 'Nomba request was not successful', {
        provider: PaymentProviderName.Nomba,
        environment: env.NOMBA_ENVIRONMENT,
        scope: env.NOMBA_VIRTUAL_ACCOUNT_SCOPE,
        method: options.method,
        path,
        status: response.status,
        providerCode: nombaCode(json),
        providerMessage,
        providerStatus: json.status,
        requestBody: options.body,
        responseKeys: responseKeys(json),
        dataKeys: responseKeys(json.data),
      } satisfies NombaErrorDetails);
    }

    logNombaCall({
      method: options.method,
      path,
      merchantTxRef: options.merchantTxRef ?? options.idempotencyKey,
      amountKobo: options.amountKobo,
      status: response.status,
      providerCode: nombaCode(json),
      latencyMs: Date.now() - started,
    });

    return json;
  }

  private async getAccessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) {
      return this.token.accessToken;
    }

    const response = await this.request<{
      access_token: string;
      refresh_token?: string;
      expiresAt?: string;
    }>('/v1/auth/token/issue', {
      method: 'POST',
      skipAuth: true,
      body: {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      },
    });

    const data = response.data ?? response;
    const accessToken = data.access_token;
    if (!accessToken) throw Errors.provider('Nomba token response did not include an access token');

    const expiresAt = data.expiresAt ? new Date(data.expiresAt).getTime() : Date.now() + 10 * 60_000;
    this.token = {
      accessToken,
      refreshToken: data.refresh_token,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + 10 * 60_000,
    };

    return accessToken;
  }
}
