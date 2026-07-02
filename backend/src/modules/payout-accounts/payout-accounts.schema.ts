import { z } from 'zod';

export const verifyPayoutAccountSchema = z.object({
  account_number: z.string().min(10).max(20),
  bank_code: z.string().min(1).max(50),
});

export const createPayoutAccountSchema = verifyPayoutAccountSchema.extend({
  bank_name: z.string().max(255).optional(),
  account_name: z.string().min(2).max(255),
  is_default: z.boolean().optional(),
});

export type VerifyPayoutAccountInput = z.infer<typeof verifyPayoutAccountSchema>;
export type CreatePayoutAccountInput = z.infer<typeof createPayoutAccountSchema>;
