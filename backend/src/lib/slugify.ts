export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'campaign';
}

export function slugWithSuffix(base: string, suffix: string): string {
  const trimmed = base.slice(0, Math.max(8, 64 - suffix.length - 1));
  return `${trimmed}-${suffix}`.slice(0, 64);
}
