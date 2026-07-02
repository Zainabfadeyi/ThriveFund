import { reportsRepository } from './reports.repository';
import { goalsService } from '../goals/goals.service';
import { parsePagination, buildMeta } from '../../shared/utils/pagination';

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
  }
  return lines.join('\n');
}

export const reportsService = {
  async financialSummary(userId: string) {
    return reportsRepository.financialSummary(userId);
  },

  async campaignExport(userId: string, goalId: string, format: 'csv' | 'pdf' = 'csv') {
    return goalsService.exportCampaign(userId, goalId, format);
  },

  async transactionsCsv(userId: string, filters: { from?: string; to?: string; goal_id?: string }) {
    const rows = await reportsRepository.transactionsReport(userId, filters);
    return toCsv(rows as Record<string, unknown>[]);
  },

  async reconciliationReport(userId: string, query: { page?: number; per_page?: number }) {
    const { page, per_page } = parsePagination(query);
    const { rows, total } = await reportsRepository.reconciliationReport(userId, page, per_page);
    return { data: rows, meta: buildMeta(page, per_page, total) };
  },
};
