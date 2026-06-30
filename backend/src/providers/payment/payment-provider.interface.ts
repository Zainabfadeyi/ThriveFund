import type { PaymentProviderName } from '../../shared/types/enums';

export interface CreateVirtualAccountRequest {
  accountName: string;
  reference: string;
  preferredBank?: string;
  metadata?: Record<string, string>;
}

export interface VirtualAccountResult {
  provider: PaymentProviderName;
  providerAccountId: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  providerReference: string;
}

export interface PaymentWebhookPayload {
  event: string;
  accountNumber: string;
  amount: number;
  currency: string;
  payerName?: string;
  reference: string;
  providerReference: string;
  status: string;
  paidAt: string;
  bankName?: string;
}

export interface VerifiedPayment {
  provider: PaymentProviderName;
  providerReference: string;
  accountNumber: string;
  amount: number;
  currency: string;
  payerName: string;
  reference: string;
  status: 'successful' | 'pending' | 'failed';
  paidAt: Date;
  bankName?: string;
}

export interface BankTransferRequest {
  amount: number;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  merchantTxRef: string;
  senderName?: string;
  narration?: string;
}

export interface BankTransferResult {
  provider: PaymentProviderName;
  providerReference: string;
  status: 'successful' | 'processing' | 'failed';
  amount: number;
  fee?: number;
  raw?: unknown;
}

export interface ExpireVirtualAccountResult {
  provider: PaymentProviderName;
  expired: boolean;
  providerReference: string;
  raw?: unknown;
}

export interface Bank {
  code: string;
  name: string;
}

export interface BankAccountLookupResult {
  accountNumber: string;
  accountName: string;
  bankCode: string;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;

  /** Create a dedicated virtual account. */
  createVirtualAccount(request: CreateVirtualAccountRequest): Promise<VirtualAccountResult>;

  /** Normalize and verify an incoming payment webhook payload */
  verifyPayment(payload: PaymentWebhookPayload): Promise<VerifiedPayment>;

  /** Transfer funds from the configured provider account to an external bank account. */
  transferToBank(request: BankTransferRequest): Promise<BankTransferResult>;

  /** Expire a dedicated virtual account by provider reference/account number. */
  expireVirtualAccount(identifier: string): Promise<ExpireVirtualAccountResult>;

  /** Fetch supported Nigerian banks and Nomba transfer bank codes. */
  listBanks(): Promise<Bank[]>;

  /** Verify a destination bank account before initiating transfer. */
  lookupBankAccount(accountNumber: string, bankCode: string): Promise<BankAccountLookupResult>;

  /** Validate webhook signature from Nomba headers and payload */
  validateWebhookSignature(rawBody: string, signature: string, timestamp?: string): boolean;

  /** Health check for readiness probe */
  healthCheck(): Promise<{ status: 'ok' | 'unavailable'; message?: string }>;
}
