/** Builds a public asset URL that works on Vercel and GitHub Pages subpaths safely. */
export function assetUrl(path?: string | null): string {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (/^(https?:|data:|blob:)/.test(trimmed)) return trimmed;
  return `${import.meta.env.BASE_URL}${trimmed.replace(/^\/+/, '')}`;
}
