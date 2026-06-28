/**
 * API client stubs — wire to backend after July 1 hackathon build phase.
 * Set NEXT_PUBLIC_USE_MOCK_DATA=false to use live endpoints.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data as T;
}

// Integration points — replace mock imports in pages with these when backend is ready
export const api = {
  organizations: {
    list: () => apiFetch('/organizations'),
    get: (id: string) => apiFetch(`/organizations/${id}`),
    create: (body: unknown) => apiFetch('/organizations', { method: 'POST', body: JSON.stringify(body) }),
  },
  campaigns: {
    list: () => apiFetch('/goals'),
    get: (id: string) => apiFetch(`/goals/${id}`),
    create: (body: unknown) => apiFetch('/goals', { method: 'POST', body: JSON.stringify(body) }),
  },
  virtualAccounts: {
    list: () => apiFetch('/virtual-accounts'),
    getByGoal: (goalId: string) => apiFetch(`/goals/${goalId}/virtual-account`),
  },
  transactions: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/transactions${qs}`);
    },
  },
  reconciliation: {
    overview: () => apiFetch('/reconciliation/overview'),
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/reconciliation${qs}`);
    },
  },
  contributors: {
    list: () => apiFetch('/contributors'),
  },
  reports: {
    financialSummary: () => apiFetch('/reports/financial-summary'),
  },
  dashboard: {
    overview: () => apiFetch('/dashboard/overview'),
  },
  admin: {
    overview: () => apiFetch('/admin/overview'),
  },
};
