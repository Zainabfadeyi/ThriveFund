'use client';

import { useSyncExternalStore } from 'react';

function readDashboardCampaignId(): string {
  if (typeof window === 'undefined') return '';

  const segments = window.location.pathname.split('/').filter(Boolean);
  const campaignsIdx = segments.indexOf('campaigns');
  const rawId = campaignsIdx >= 0 ? segments[campaignsIdx + 1] ?? '' : '';
  return rawId && rawId !== '_' && rawId !== 'new' && rawId !== 'campaigns' ? decodeURIComponent(rawId) : '';
}

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener('hashchange', onChange);
  };
}

export function useDashboardCampaignId() {
  return useSyncExternalStore(subscribe, readDashboardCampaignId, () => '');
}
