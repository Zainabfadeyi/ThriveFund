import { z } from 'zod';

export const createWithdrawalSchema = z.object({
  payout_account_id: z.string().min(1).optional(),
  amount: z.coerce.number().positive().optional(),
  narration: z.string().max(255).optional(),
});

export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
