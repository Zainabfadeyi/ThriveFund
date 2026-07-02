import { v4 as uuid } from 'uuid';
import { Errors } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import { buildContributionUrl } from '../../lib/frontend-url';
import { getPaymentProvider } from '../../providers/payment';
import { AuditAction } from '../../shared/types/enums';
import { goalsRepository } from './goals.repository';
import { transactionsRepository } from '../transactions/transactions.repository';
import { organizationsRepository } from '../organizations/organizations.repository';
import { virtualAccountsRepository } from '../virtual-accounts/virtual-accounts.repository';
import type { CreateGoalInput, UpdateGoalInput, CloseOutGoalInput } from './goals.schema';

export const goalsService = {
  async create(userId: string, body: CreateGoalInput) {
    if (body.organization_id) {
      const canAccess = await organizationsRepository.canAccess(body.organization_id, userId);
      if (!canAccess) throw Errors.notFound('Organization');
    }

    const id = `goal_${uuid().replace(/-/g, '').slice(0, 12)}`;
    return goalsRepository.insert({ id, user_id: userId, ...body });
  },

  async list(userId: string, query: {
    status?: string;
    category?: string;
    q?: string;
    page?: number;
    per_page?: number;
  }) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.per_page ?? 20, 100);
    const { rows, total } = await goalsRepository.findAllByUser(userId, {
      status: query.status,
      category: query.category,
      q: query.q,
      page,
      perPage,
    });
    return { data: rows, meta: { page, per_page: perPage, total } };
  },

  async getById(userId: string, goalId: string) {
    const goal = await goalsRepository.findById(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');
    return goal;
  },

  async update(userId: string, goalId: string, body: UpdateGoalInput) {
    const exists = await goalsRepository.findByIdRaw(goalId, userId);
    if (!exists) throw Errors.notFound('Goal');

    if (body.organization_id) {
      const canAccess = await organizationsRepository.canAccess(body.organization_id, userId);
      if (!canAccess) throw Errors.notFound('Organization');
    }

    const updated = await goalsRepository.update(goalId, userId, body as Record<string, unknown>);
    if (!updated) throw Errors.validation('No valid fields to update');
    return updated;
  },

  async delete(userId: string, goalId: string) {
    const pendingCount = await transactionsRepository.countPendingByGoal(goalId);
    if (pendingCount > 0) throw Errors.conflict('Cannot delete goal with pending transactions');

    const deleted = await goalsRepository.delete(goalId, userId);
    if (!deleted) throw Errors.notFound('Goal');
  },

  async close(userId: string, goalId: string) {
    const goal = await goalsRepository.updateStatus(goalId, userId, 'completed');
    if (!goal) throw Errors.notFound('Goal');
    return goal;
  },

  async closeOut(userId: string, goalId: string, body: CloseOutGoalInput) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');

    const currentAmount = Number(goal.current_amount);
    const targetAmount = Number(goal.target_amount);
    if ((goal.status as string) !== 'completed' && currentAmount < targetAmount) {
      throw Errors.conflict('Campaign target is not complete yet');
    }

    const va = await virtualAccountsRepository.findByGoalAndUser(goalId, userId);
    if (!va) throw Errors.notFound('Active virtual account');

    const amount = body.amount ?? currentAmount;
    if (amount > currentAmount) {
      throw Errors.validation('Transfer amount cannot exceed campaign balance');
    }

    const provider = getPaymentProvider();
    const lookup = await provider.lookupBankAccount(body.account_number, body.bank_code);
    const providedName = body.account_name.trim().toLowerCase();
    const lookedUpName = lookup.accountName.trim().toLowerCase();
    if (providedName && providedName !== lookedUpName) {
      throw Errors.validation('Destination account name does not match Nomba bank lookup', {
        expected_account_name: lookup.accountName,
      });
    }

    const merchantTxRef = `TF-OUT-${goalId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 40)}`.slice(0, 64);
    const transfer = await provider.transferToBank({
      amount,
      accountNumber: lookup.accountNumber,
      accountName: lookup.accountName,
      bankCode: lookup.bankCode,
      merchantTxRef,
      senderName: 'ThriveFund',
      narration: body.narration ?? `ThriveFund payout - ${goal.title as string}`,
    });

    const expireIdentifier = (va.provider_reference as string) || (va.account_number as string);
    const expiry = await provider.expireVirtualAccount(expireIdentifier);
    const updatedVa = await virtualAccountsRepository.markInactive(va.id as string);
    const updatedGoal = await goalsRepository.updateStatus(goalId, userId, 'completed');

    await logAudit({
      action: AuditAction.GoalClosedOut,
      actor_id: userId,
      organization_id: goal.organization_id as string | null,
      resource_type: 'goal',
      resource_id: goalId,
      metadata: {
        virtual_account_id: va.id,
        transfer_provider_reference: transfer.providerReference,
        transfer_status: transfer.status,
        transfer_amount: transfer.amount,
        transfer_fee: transfer.fee,
        expired_virtual_account: expiry.expired,
      },
    });

    const { raw: _transferRaw, ...transferResponse } = transfer;
    const { raw: _expiryRaw, ...expiryResponse } = expiry;

    return {
      goal: updatedGoal,
      virtual_account: updatedVa,
      transfer: transferResponse,
      expiry: expiryResponse,
    };
  },

  async getShareLink(userId: string, goalId: string) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');
    const slug = (goal.slug as string | null) ?? goalId;
    return {
      public_url: buildContributionUrl(slug),
      slug,
      qr_code_url: `https://api.thrivefund.live/api/v1/goals/${goalId}/qr.png`,
    };
  },

  async exportCampaign(userId: string, goalId: string) {
    const pack = await goalsRepository.exportPack(goalId, userId);
    if (!pack) throw Errors.notFound('Goal');
    return campaignExportCsv(pack);
  },

  async exportCampaignAdmin(goalId: string) {
    const pack = await goalsRepository.exportPack(goalId);
    if (!pack) throw Errors.notFound('Goal');
    return campaignExportCsv(pack);
  },
};

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function csvSection(title: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return `${title}\n(no rows)\n`;
  const headers = Object.keys(rows[0]);
  return [
    title,
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
    '',
  ].join('\n');
}

function campaignExportCsv(pack: {
  goal: Record<string, unknown>;
  transactions: Record<string, unknown>[];
  contributors: Record<string, unknown>[];
  virtual_accounts: Record<string, unknown>[];
  reconciliation: Record<string, unknown>[];
}) {
  return [
    csvSection('Campaign Summary', [pack.goal]),
    csvSection('Virtual Accounts', pack.virtual_accounts),
    csvSection('Transactions', pack.transactions),
    csvSection('Contributors', pack.contributors),
    csvSection('Reconciliation', pack.reconciliation),
  ].join('\n');
}
