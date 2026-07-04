import { v4 as uuid } from 'uuid';
import { getPaymentProvider } from '../../providers/payment';
import type { PaymentWebhookPayload } from '../../providers/payment';
import { logAudit } from '../../lib/audit';
import { AuditAction, PaymentStatus } from '../../shared/types/enums';
import { Errors } from '../../lib/errors';
import { paymentsRepository } from './payments.repository';
import { webhooksRepository } from '../webhooks/webhooks.repository';

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object'
    && err !== null
    && 'code' in err
    && (err as { code?: string }).code === 'ER_DUP_ENTRY';
}

export const paymentsService = {
  /**
   * Verify incoming webhook payload via payment provider abstraction.
   * Creates a payment record — does NOT reconcile or create transactions.
   */
  async ingestFromWebhook(webhookEventId: string, payload: PaymentWebhookPayload) {
    const provider = getPaymentProvider();

    const existing = await paymentsRepository.findByProviderReference(payload.providerReference);
    if (existing) {
      await webhooksRepository.markStatus(payload.providerReference, 'duplicate');
      return { payment: existing, duplicate: true };
    }

    const verified = await provider.verifyPayment(payload);

    try {
      const payment = await paymentsRepository.insert({
        id: `pay_${uuid().replace(/-/g, '').slice(0, 12)}`,
        webhook_event_id: webhookEventId,
        provider: verified.provider,
        provider_reference: verified.providerReference,
        account_number: verified.accountNumber,
        amount: verified.amount,
        currency: verified.currency,
        payer_name: verified.payerName,
        reference: verified.reference,
        status: verified.status === 'successful' ? PaymentStatus.Verified : PaymentStatus.Received,
        paid_at: verified.paidAt,
      });

      await logAudit({
        action: AuditAction.PaymentVerified,
        resource_type: 'payment',
        resource_id: payment.id as string,
        metadata: { provider_reference: verified.providerReference, amount: verified.amount },
      });

      return { payment, duplicate: false, verified };
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
      const payment = await paymentsRepository.findByProviderReference(payload.providerReference);
      if (!payment) throw err;
      await webhooksRepository.markStatus(payload.providerReference, 'duplicate');
      return { payment, duplicate: true };
    }
  },

  async getById(id: string) {
    const payment = await paymentsRepository.findById(id);
    if (!payment) throw Errors.notFound('Payment');
    return payment;
  },

  async list(query: { status?: string; page?: number; per_page?: number }) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.per_page ?? 20, 100);
    const { rows, total } = await paymentsRepository.findAll({ status: query.status, page, perPage });
    return { data: rows, meta: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) || 1 } };
  },
};
