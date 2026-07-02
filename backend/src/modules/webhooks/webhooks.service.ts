import { v4 as uuid } from 'uuid';
import { getPaymentProvider } from '../../providers/payment';
import type { PaymentWebhookPayload } from '../../providers/payment';
import { Errors } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import { AuditAction } from '../../shared/types/enums';
import { webhooksRepository } from './webhooks.repository';
import { paymentsService } from '../payments/payments.service';
import { reconciliationService } from '../reconciliation/reconciliation.service';
import { withdrawalsService } from '../withdrawals/withdrawals.service';
import { broadcastRealtime } from '../../lib/realtime';
import { sendEmail, webhookFailureEmail } from '../../lib/email';
import { env } from '../../config/env';

interface NombaPayload {
  event?: string;
  eventType?: string;
  event_type?: string;
  type?: string;
  requestId?: string;
  request_id?: string;
  data?: Record<string, unknown> & {
    transaction?: Record<string, unknown>;
    customer?: Record<string, unknown>;
  };
}

function toProviderPayload(payload: NombaPayload): PaymentWebhookPayload {
  const data = payload.data ?? {};
  const transaction = data.transaction ?? {};
  const customer = data.customer ?? {};
  const accountNumber = stringFrom(
    data.account_number,
    data.accountNumber,
    data.bankAccountNumber,
    transaction.aliasAccountNumber,
  );
  const providerReference = stringFrom(
    data.provider_reference,
    data.providerReference,
    data.sessionId,
    data.transactionId,
    data.id,
    transaction.sessionId,
    transaction.aliasAccountSessionId,
    transaction.transactionId,
  );
  const event = eventName(payload);

  return {
    event,
    accountNumber,
    amount: numberFrom(data.amount, data.paymentAmount, transaction.transactionAmount),
    currency: stringFrom(data.currency) || 'NGN',
    payerName: stringFrom(data.payer_name, data.payerName, data.senderName, data.customerName, customer.senderName),
    reference:
      stringFrom(data.reference, data.accountRef, data.merchantReference, transaction.aliasAccountReference) ||
      providerReference,
    providerReference,
    status: statusFromEvent(event, stringFrom(data.status, data.transactionStatus)),
    paidAt: stringFrom(data.paid_at, data.paidAt, data.createdAt, data.date, transaction.time) || new Date().toISOString(),
    bankName: stringFrom(data.bank_name, data.bankName, data.sourceBankName, customer.bankName),
  };
}

function eventName(payload: NombaPayload): string {
  return payload.event ?? payload.eventType ?? payload.event_type ?? payload.type ?? 'payment.received';
}

function shouldIngestPayment(event: string): boolean {
  return ['payment_success', 'payment.received', 'payment.success'].includes(event);
}

function shouldIngestPayout(event: string): boolean {
  return [
    'payout_success',
    'payout.success',
    'payout_failed',
    'payout.failed',
    'payout_refund',
    'transfer_success',
    'transfer_failed',
  ].includes(event);
}

function statusFromEvent(event: string, fallback: string): string {
  if (event === 'payment_success') return 'successful';
  if (event === 'payment_failed') return 'failed';
  return fallback || 'pending';
}

function stringFrom(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function numberFrom(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return 0;
}

export const webhooksService = {
  /**
   * Webhook ingestion only:
   * 1. Validate signature
   * 2. Store raw webhook_events
   * 3. Delegate to payments → reconciliation
   */
  async processNomba(
    rawBody: string,
    signature: string,
    payload: NombaPayload,
    timestamp?: string,
    options: { skipSignature?: boolean } = {},
  ) {
    const provider = getPaymentProvider();

    if (!options.skipSignature && !provider.validateWebhookSignature(rawBody, signature, timestamp)) {
      throw Errors.unauthorized('Invalid webhook signature');
    }

    const providerPayload = toProviderPayload(payload);
    if (!providerPayload.providerReference) {
      throw Errors.validation('Nomba webhook payload is missing transaction details');
    }

    const requestId = stringFrom(payload.requestId, payload.request_id);
    if (requestId) {
      const existingByRequest = await webhooksRepository.findByRequestId(requestId);
      if (existingByRequest) {
        return { received: true, duplicate: true, reason: 'request_id' };
      }
    }

    const event = await webhooksRepository.insertEvent({
      id: `wh_${uuid().replace(/-/g, '').slice(0, 12)}`,
      provider: provider.name,
      event_type: providerPayload.event,
      provider_reference: providerPayload.providerReference,
      request_id: requestId || undefined,
      payload: rawBody,
    });

    if (!event) {
      return { received: true, duplicate: true, reason: 'provider_reference' };
    }

    if (!shouldIngestPayment(providerPayload.event)) {
      if (shouldIngestPayout(providerPayload.event)) {
        const transaction = (payload.data?.transaction ?? {}) as Record<string, unknown>;
        const merchantTxRef = stringFrom(transaction.merchantTxRef, transaction.merchant_tx_ref);
        const providerReference = stringFrom(
          transaction.transactionId,
          transaction.id,
          providerPayload.providerReference,
        );
        const fee = numberFrom(transaction.fee) || undefined;

        const result = await withdrawalsService.reconcileFromWebhook({
          event: providerPayload.event,
          merchantTxRef: merchantTxRef || undefined,
          providerReference: providerReference || undefined,
          fee,
        });

        await webhooksRepository.markStatus(providerPayload.providerReference, 'processed');
        return {
          received: true,
          payout: true,
          matched: result.matched,
          duplicate: 'duplicate' in result ? result.duplicate : undefined,
        };
      }

      await webhooksRepository.markStatus(providerPayload.providerReference, 'processed');
      return { received: true, ignored: true, event: providerPayload.event };
    }

    if (!providerPayload.accountNumber) {
      throw Errors.validation('Nomba payment webhook payload is missing virtual account details');
    }

    await logAudit({
      action: AuditAction.WebhookReceived,
      resource_type: 'webhook_event',
      resource_id: event.id as string,
      metadata: { provider_reference: providerPayload.providerReference },
    });

    try {
      const { payment, duplicate } = await paymentsService.ingestFromWebhook(
        event.id as string,
        providerPayload,
      );

      if (duplicate) {
        return { received: true, duplicate: true };
      }

      const result = await reconciliationService.reconcilePayment({
        id: payment.id as string,
        webhook_event_id: event.id as string,
        provider_reference: payment.provider_reference as string,
        account_number: payment.account_number as string,
        amount: Number(payment.amount),
        payer_name: payment.payer_name as string,
        reference: payment.reference as string,
        status: payment.status as string,
        paid_at: payment.paid_at as string | undefined,
      });

      return {
        received: true,
        matched: result.matched,
        transaction_id: result.transaction_id,
        reconciliation_id: (result.reconciliation as { id?: string })?.id,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Processing failed';
      await webhooksRepository.markFailed(providerPayload.providerReference, message);
      broadcastRealtime({
        type: 'webhook.failed',
        goal_id: undefined,
        data: {
          provider_reference: providerPayload.providerReference,
          event: providerPayload.event,
          message,
        },
      });
      const admins = await webhooksRepository.listAdminRecipients().catch(() => []);
      if (admins.length) {
        const { subject, html } = webhookFailureEmail(
          providerPayload.event,
          providerPayload.providerReference,
          `${env.FRONTEND_URL}/admin`,
        );
        await sendEmail({
          to: admins.map((admin) => ({ email: admin.email, name: admin.full_name })),
          subject,
          html,
        }).catch(() => undefined);
      }
      throw err;
    }
  },
};
