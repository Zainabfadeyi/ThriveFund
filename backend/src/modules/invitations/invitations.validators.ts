import { z } from 'zod';

export const sendInvitationSchema = z.object({
  recipients: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    phone_number: z.string().optional(),
    group_label: z.string().optional(),
    expected_amount: z.coerce.number().positive().optional(),
  })).min(1).max(1000),
  channel: z.literal('email').default('email'),
  message: z.string().max(500).optional(),
});

export type SendInvitationDto = z.infer<typeof sendInvitationSchema>;
