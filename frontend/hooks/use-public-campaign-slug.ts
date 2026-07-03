'use client';

import { useSyncExternalStore } from 'react';

function readSlugFromBrowser(): string {
  if (typeof window === 'undefined') return '';

  const segments = window.location.pathname.split('/').filter(Boolean);
  const cIdx = segments.indexOf('c');
  const raw = cIdx >= 0 ? segments[cIdx + 1] ?? '' : '';
  return raw && raw !== '_' && raw !== 'success' ? decodeURIComponent(raw) : '';
}

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener('hashchange', onChange);
  };
}

/** Read the real /c/:slug segment from the browser URL (Cloudflare static export rewrites to /c/_/). */
export function usePublicCampaignSlug() {
  return useSyncExternalStore(subscribe, readSlugFromBrowser, () => '');
}
