import { v4 as uuid } from 'uuid';
import { Errors } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import { AuditAction } from '../../shared/types/enums';
import { parsePagination, buildMeta } from '../../shared/utils/pagination';
import { organizationsRepository } from './organizations.repository';
import type { CreateOrganizationDto, UpdateOrganizationDto } from './organizations.validators';
import { organizationMembersRepository } from '../organization-members/organization-members.repository';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}

export const organizationsService = {
  async create(userId: string, body: CreateOrganizationDto) {
    const baseSlug = slugify(body.name);
    let slug = baseSlug;
    let attempt = 0;
    while (await organizationsRepository.findBySlug(slug)) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const id = `org_${uuid().replace(/-/g, '').slice(0, 12)}`;
    const org = await organizationsRepository.insert({ id, slug, owner_id: userId, ...body });

    await organizationMembersRepository.insert({
      id: `om_${uuid().replace(/-/g, '').slice(0, 12)}`,
      organization_id: id,
      user_id: userId,
      role: 'owner',
    });

    await logAudit({
      action: AuditAction.OrganizationCreated,
      actor_id: userId,
      organization_id: id,
      resource_type: 'organization',
      resource_id: id,
    });

    return org;
  },

  async list(userId: string, query: { page?: number; per_page?: number }) {
    const { page, per_page, offset: _ } = parsePagination(query);
    const { rows, total } = await organizationsRepository.findByUser(userId, page, per_page);
    return { data: rows, meta: buildMeta(page, per_page, total) };
  },

  async getById(userId: string, orgId: string) {
    const org = await organizationsRepository.findDetailById(orgId);
    if (!org) throw Errors.notFound('Organization');
    const isMember = await organizationMembersRepository.isMember(orgId, userId);
    if (!isMember && (org as unknown as { owner_id: string }).owner_id !== userId) {
      throw Errors.forbidden();
    }
    return org;
  },

  async update(userId: string, orgId: string, body: UpdateOrganizationDto) {
    await this.getById(userId, orgId);
    const canManage = await organizationMembersRepository.hasRole(orgId, userId, ['owner', 'admin']);
    if (!canManage) throw Errors.forbidden('Only owners and admins can update organization');
    return organizationsRepository.update(orgId, body);
  },
};
