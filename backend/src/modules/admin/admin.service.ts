import { Errors } from '../../lib/errors';
import { adminRepository } from './admin.repository';
import { webhooksRepository } from '../webhooks/webhooks.repository';
import { reconciliationService } from '../reconciliation/reconciliation.service';
import { resolveReconciliationSchema, type ResolveReconciliationDto } from '../reconciliation/reconciliation.validators';
import { webhooksService } from '../webhooks/webhooks.service';
import { goalsService } from '../goals/goals.service';

export const adminService = {
  async overview() {
    const stats = await adminRepository.getPlatformStats();
    const reconciliation = await reconciliationService.overview();
    return { ...stats, reconciliation };
  },

  async listReconciliation(query: { status?: string; from?: string; to?: string; page?: number; per_page?: number }) {
    return reconciliationService.listAdmin(query);
  },

  async getReconciliation(id: string) {
    return reconciliationService.getById(id);
  },

  async resolveReconciliation(id: string, body: ResolveReconciliationDto) {
    const parsed = resolveReconciliationSchema.parse(body);
    return reconciliationService.resolveManual(id, parsed);
  },

  async listWebhookEvents(query: { processed?: string; event_type?: string; page?: number; per_page?: number }) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.per_page ?? 20, 100);
    const rows = await webhooksRepository.findAll({
      processed: query.processed !== undefined ? query.processed === 'true' : undefined,
      event_type: query.event_type,
      page,
      perPage,
    });
    return rows;
  },

  async retryWebhookEvent(id: string) {
    const event = await webhooksRepository.findById(id);
    if (!event) throw Errors.notFound('Webhook event');
    const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
    const signature = '';
    const rawBody = typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload);
    return webhooksService.processNomba(rawBody, signature, payload, undefined, { skipSignature: true });
  },

  async listUsers(query: { page?: number; per_page?: number }) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.per_page ?? 20, 100);
    return adminRepository.listUsers(page, perPage);
  },

  async listGoals(query: { page?: number; per_page?: number }) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.per_page ?? 20, 100);
    return adminRepository.listGoalsEnhanced({ page, perPage });
  },

  async listOrganizations(query: { q?: string; type?: string; page?: number; per_page?: number }) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.per_page ?? 20, 100);
    return adminRepository.listOrganizations({ q: query.q, type: query.type, page, perPage });
  },

  async getOrganization(id: string) {
    const org = await adminRepository.getOrganizationDetail(id);
    if (!org) throw Errors.notFound('Organization');
    return org;
  },

  async updateOrganization(id: string, body: Record<string, unknown>) {
    const org = await adminRepository.updateOrganization(id, body);
    if (!org) throw Errors.notFound('Organization');
    return org;
  },

  async listGoalsEnhanced(query: {
    page?: number;
    per_page?: number;
    organization_id?: string;
    status?: string;
    q?: string;
  }) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.per_page ?? 20, 100);
    return adminRepository.listGoalsEnhanced({
      page,
      perPage,
      organization_id: query.organization_id,
      status: query.status,
      q: query.q,
    });
  },

  async updateGoalStatus(goalId: string, body: { status?: string }) {
    const status = body.status;
    if (!status || !['active', 'completed', 'paused', 'cancelled'].includes(status)) {
      throw Errors.validation('status must be active, completed, paused, or cancelled');
    }
    const goal = await adminRepository.updateGoalStatus(goalId, status);
    if (!goal) throw Errors.notFound('Goal');
    return goal;
  },

  async exportGoal(goalId: string) {
    return goalsService.exportCampaignAdmin(goalId);
  },

  async listTransactions(query: { page?: number; per_page?: number }) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.per_page ?? 20, 100);
    return adminRepository.listTransactions(page, perPage);
  },
};
