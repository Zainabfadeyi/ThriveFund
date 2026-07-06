import { Errors } from '../../lib/errors';
import { paymentProofFilename, paymentProofPdf, type PaymentProof } from '../../lib/payment-proof';
import { transactionsRepository } from './transactions.repository';

interface ListQuery {
  goal_id?: string;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  per_page?: number;
}

export const transactionsService = {
  async list(userId: string, query: ListQuery) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.per_page ?? 20, 100);
    const { rows, total } = await transactionsRepository.findAll(userId, {
      goal_id: query.goal_id,
      status:  query.status,
      from:    query.from,
      to:      query.to,
      q:       query.q,
      page,
      perPage,
    });
    return { data: rows, meta: { page, per_page: perPage, total } };
  },

  async getById(userId: string, txnId: string) {
    const txn = await transactionsRepository.findById(txnId, userId);
    if (!txn) throw Errors.notFound('Transaction');
    return txn;
  },

  async getByGoal(userId: string, goalId: string, query: Omit<ListQuery, 'goal_id'>) {
    return this.list(userId, { ...query, goal_id: goalId });
  },

  async export(userId: string, filters: { goal_id?: string; from?: string; to?: string; status?: string }) {
    return transactionsRepository.findForExport(userId, filters);
  },

  async receipt(userId: string, txnId: string) {
    const receipt = await transactionsRepository.findReceiptById(txnId, userId);
    if (!receipt) throw Errors.notFound('Transaction');
    if (String(receipt.status) !== 'successful') {
      throw Errors.conflict('Payment proof is only available for successful payments');
    }
    const proof: PaymentProof = {
      transaction_id: String(receipt.transaction_id),
      campaign_title: String(receipt.campaign_title ?? ''),
      organization_name: receipt.organization_name ? String(receipt.organization_name) : null,
      payer_name: String(receipt.payer_name ?? 'Anonymous'),
      amount: Number(receipt.amount ?? 0),
      status: String(receipt.status ?? ''),
      paid_at: receipt.paid_at ? String(receipt.paid_at) : null,
      reference: receipt.reference ? String(receipt.reference) : null,
      provider_reference: receipt.provider_reference ? String(receipt.provider_reference) : null,
      virtual_account_number: receipt.virtual_account_number ? String(receipt.virtual_account_number) : null,
      bank_name: receipt.bank_name ? String(receipt.bank_name) : null,
      account_name: receipt.account_name ? String(receipt.account_name) : null,
      reconciliation_status: receipt.reconciliation_status ? String(receipt.reconciliation_status) : null,
      verification_status: receipt.verification_status ? String(receipt.verification_status) : null,
    };
    const body = await paymentProofPdf(proof);
    return { body, filename: paymentProofFilename(proof) };
  },
};
