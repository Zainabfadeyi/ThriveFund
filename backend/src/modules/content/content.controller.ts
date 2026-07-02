import type { Request, Response, NextFunction } from 'express';
import { ok } from '../../lib/response';
import { getPaymentProvider } from '../../providers/payment';
import { Errors } from '../../lib/errors';
import { getPayoutFeeInfo } from '../../lib/payout-fees';

const CATEGORIES = [
  { slug: 'community_project', label: 'Community Project' },
  { slug: 'wedding',           label: 'Wedding' },
  { slug: 'religious',         label: 'Religious' },
  { slug: 'education',         label: 'Education' },
  { slug: 'business',          label: 'Business' },
  { slug: 'personal',          label: 'Personal' },
];

const FAQS = [
  { question: 'What is ThriveFund?',              answer: 'A platform for goal-based savings and group contributions using dedicated virtual accounts.' },
  { question: 'Which banks are supported?',        answer: 'First Bank, GTBank, Zenith Bank, UBA, and Access Bank.' },
  { question: 'How does a virtual account work?', answer: 'Each goal gets a unique bank account number. Any transfer to that number is automatically matched to your goal.' },
  { question: 'Is my money safe?',                answer: 'All payments are processed by Nomba, a CBN-licensed payment provider.' },
];

export const contentController = {
  categories(_req: Request, res: Response, next: NextFunction) {
    try { ok(res, CATEGORIES); } catch (err) { next(err); }
  },

  async banks(_req: Request, res: Response, next: NextFunction) {
    try {
      ok(res, await getPaymentProvider().listBanks());
    } catch (err) { next(err); }
  },

  async lookupBank(req: Request, res: Response, next: NextFunction) {
    try {
      const { account_number, bank_code } = req.body as { account_number?: string; bank_code?: string };
      if (!account_number || !bank_code) {
        throw Errors.validation('account_number and bank_code are required');
      }
      const result = await getPaymentProvider().lookupBankAccount(account_number, bank_code);
      ok(res, {
        account_number: result.accountNumber,
        account_name: result.accountName,
        bank_code: result.bankCode,
      });
    } catch (err) { next(err); }
  },

  faqs(_req: Request, res: Response, next: NextFunction) {
    try { ok(res, FAQS); } catch (err) { next(err); }
  },

  payoutInfo(_req: Request, res: Response, next: NextFunction) {
    try { ok(res, getPayoutFeeInfo()); } catch (err) { next(err); }
  },
};
