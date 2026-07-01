import { v4 as uuid } from 'uuid';
import { Errors } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import { AuditAction } from '../../shared/types/enums';
import { sendEmail, invitationEmail } from '../../lib/email';
import { buildContributionUrl } from '../../lib/frontend-url';
import { invitationsRepository } from './invitations.repository';
import { goalsRepository } from '../goals/goals.repository';
import { usersRepository } from '../users/users.repository';
import { contributorsRepository } from '../contributors/contributors.repository';
import type { SendInvitationDto } from './invitations.validators';

export const invitationsService = {
  async sendToGoal(userId: string, goalId: string, body: SendInvitationDto) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');

    const inviter = await usersRepository.findById(userId);
    const inviterName = (inviter?.full_name as string | undefined) ?? 'Someone';
    const goalTitle = goal.title as string;
    const slug = (goal.slug as string | null) ?? goalId;
    const contributionLink = buildContributionUrl(slug);
    const uniqueRecipients = Array.from(
      new Map(body.recipients.map((r) => [r.email.trim().toLowerCase(), r])).values(),
    );

    const results = [];

    for (const r of uniqueRecipients) {
      const token = uuid().slice(0, 16);
      const email = r.email.trim().toLowerCase();
      const expectedAmount = r.expected_amount ? Number(r.expected_amount) : undefined;
      await contributorsRepository.upsertExpectedPayer({
        id: `ctr_${uuid().replace(/-/g, '').slice(0, 12)}`,
        goal_id: goalId,
        organization_id: (goal.organization_id as string | null) ?? null,
        name: r.name?.trim() || email.split('@')[0],
        email,
        phone_number: r.phone_number,
        group_label: r.group_label,
        expected_amount: expectedAmount,
        unique_reference: uuid().slice(0, 8).toUpperCase(),
      });

      const saved = await invitationsRepository.insert({
        id: `inv_${uuid().replace(/-/g, '').slice(0, 12)}`,
        goal_id: goalId,
        invited_by: userId,
        email,
        name: r.name?.trim() || undefined,
        channel: body.channel,
        token,
        message: body.message,
      });

      const { subject, html } = invitationEmail(goalTitle, inviterName, contributionLink, body.message, expectedAmount);
      await sendEmail({ to: { email, name: r.name }, subject, html });

      await logAudit({
        action: AuditAction.InvitationSent,
        actor_id: userId,
        resource_type: 'invitation',
        resource_id: saved.id as string,
        metadata: { goal_id: goalId, email },
      });

      results.push(saved);
    }

    return results;
  },

  async remindOutstanding(userId: string, goalId: string) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');

    const inviter = await usersRepository.findById(userId);
    const inviterName = (inviter?.full_name as string | undefined) ?? 'Someone';
    const goalTitle = goal.title as string;
    const slug = (goal.slug as string | null) ?? goalId;
    const contributionLink = buildContributionUrl(slug);
    const outstanding = await contributorsRepository.findOutstandingWithEmail(goalId);
    const sent = [];

    for (const row of outstanding as Array<{ email: string; name: string; expected_amount: number; total_contributed: number }>) {
      const balance = Number(row.expected_amount) - Number(row.total_contributed);
      const { subject, html } = invitationEmail(
        goalTitle,
        inviterName,
        contributionLink,
        `Reminder: your outstanding balance is ₦${balance.toLocaleString()}.`,
        balance,
      );
      await sendEmail({ to: { email: row.email, name: row.name }, subject, html });
      sent.push({ email: row.email, name: row.name, outstanding_amount: balance });
    }

    return { sent_count: sent.length, recipients: sent };
  },

  async listByGoal(userId: string, goalId: string) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');
    return invitationsRepository.findByGoal(goalId);
  },

  async accept(token: string) {
    const invitation = await invitationsRepository.findByToken(token);
    if (!invitation) throw Errors.notFound('Invitation');
    await invitationsRepository.updateStatus(invitation.id as string, 'accepted');
    return { accepted: true, goal_id: invitation.goal_id };
  },
};
