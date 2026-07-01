import { v4 as uuid } from 'uuid';
import { Errors } from '../../lib/errors';
import { sendEmail, invitationEmail } from '../../lib/email';
import { buildContributionUrl } from '../../lib/frontend-url';
import { contributorsRepository } from './contributors.repository';
import { goalsRepository } from '../goals/goals.repository';
import { usersRepository } from '../users/users.repository';

export const contributorsService = {
  async listAll(userId: string) {
    return contributorsRepository.findAllByUser(userId);
  },

  async getByGoal(userId: string, goalId: string) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');
    return contributorsRepository.findByGoal(goalId);
  },

  async addToGoal(
    userId: string,
    goalId: string,
    body: { name: string; email?: string; phone_number?: string; group_label?: string; expected_amount?: number },
  ) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');

    return contributorsRepository.insert({
      id: `ctr_${uuid().replace(/-/g, '').slice(0, 12)}`,
      goal_id: goalId,
      name: body.name,
      email: body.email,
      phone_number: body.phone_number,
      group_label: body.group_label,
      expected_amount: body.expected_amount,
      unique_reference: uuid().slice(0, 8).toUpperCase(),
    });
  },

  async getSummary(userId: string, goalId: string) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');
    return contributorsRepository.outstandingSummary(goalId);
  },

  async sendInvitation(
    userId: string,
    goalId: string,
    body: { recipients: { email: string; name?: string }[]; channel: string; message?: string },
  ) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');

    const inviter = await usersRepository.findById(userId);
    const inviterName = (inviter?.full_name as string | undefined) ?? 'Someone';
    const goalTitle = goal.title as string;
    const slug = (goal.slug as string | null) ?? goalId;
    const contributionLink = buildContributionUrl(slug);

    return Promise.all(
      body.recipients.map(async (r) => {
        const saved = await contributorsRepository.insertInvitation({
          id: `inv_${uuid().replace(/-/g, '').slice(0, 12)}`,
          goal_id: goalId,
          email: r.email,
          name: r.name,
          channel: body.channel,
        });

        if (body.channel === 'email') {
          const { subject, html } = invitationEmail(goalTitle, inviterName, contributionLink, body.message);
          await sendEmail({ to: { email: r.email, name: r.name }, subject, html });
        }

        return saved;
      }),
    );
  },

  async getInvitations(userId: string, goalId: string) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');
    return contributorsRepository.findInvitationsByGoal(goalId);
  },
};
