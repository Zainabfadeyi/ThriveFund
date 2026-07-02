import { v4 as uuid } from 'uuid';
import { Errors } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import { getPaymentProvider } from '../../providers/payment';
import { AuditAction } from '../../shared/types/enums';
import { organizationsRepository } from '../organizations/organizations.repository';
import { payoutAccountsRepository } from './payout-accounts.repository';
import type { CreatePayoutAccountInput, VerifyPayoutAccountInput } from './payout-accounts.schema';

async function defaultOrganizationId(userId: string) {
  const { rows } = await organizationsRepository.findByUser(userId, 1, 1);
  return (rows[0] as { id?: string } | undefined)?.id ?? null;
}

export const payoutAccountsService = {
  async list(userId: string) {
    return payoutAccountsRepository.findByUser(userId);
  },

  async verify(body: VerifyPayoutAccountInput) {
    const provider = getPaymentProvider();
    const lookup = await provider.lookupBankAccount(body.account_number, body.bank_code);
    const banks = await provider.listBanks().catch(() => []);
    const bank = banks.find((item) => item.code === lookup.bankCode || item.code === body.bank_code);
    return {
      account_number: lookup.accountNumber,
      account_name: lookup.accountName,
      bank_code: lookup.bankCode,
      bank_name: bank?.name ?? null,
      provider: provider.name,
    };
  },

  async create(userId: string, body: CreatePayoutAccountInput) {
    const verified = await this.verify(body);
    const providedName = body.account_name.trim().toLowerCase();
    const verifiedName = verified.account_name.trim().toLowerCase();
    if (providedName && providedName !== verifiedName) {
      throw Errors.validation('Account name does not match bank lookup', {
        expected_account_name: verified.account_name,
      });
    }

    const existingAccounts = await payoutAccountsRepository.findByUser(userId);
    const account = await payoutAccountsRepository.insert({
      id: `poa_${uuid().replace(/-/g, '').slice(0, 12)}`,
      user_id: userId,
      organization_id: await defaultOrganizationId(userId),
      provider: verified.provider,
      bank_code: verified.bank_code,
      bank_name: body.bank_name ?? verified.bank_name,
      account_number: verified.account_number,
      account_name: verified.account_name,
      is_default: body.is_default ?? existingAccounts.length === 0,
    });

    await logAudit({
      action: AuditAction.PayoutAccountCreated,
      actor_id: userId,
      organization_id: (account as { organization_id?: string | null }).organization_id ?? null,
      resource_type: 'payout_account',
      resource_id: (account as { id: string }).id,
      metadata: {
        bank_code: verified.bank_code,
        bank_name: body.bank_name ?? verified.bank_name,
        account_number_last4: verified.account_number.slice(-4),
      },
    });

    return account;
  },

  async setDefault(userId: string, id: string) {
    const account = await payoutAccountsRepository.setDefault(id, userId);
    if (!account) throw Errors.notFound('Payout account');
    return account;
  },

  async delete(userId: string, id: string) {
    try {
      const deleted = await payoutAccountsRepository.delete(id, userId);
      if (!deleted) throw Errors.notFound('Payout account');
    } catch (err) {
      if ((err as { code?: string }).code === 'ER_ROW_IS_REFERENCED_2') {
        throw Errors.conflict('Cannot delete a payout account that has withdrawal history');
      }
      throw err;
    }
  },
};
