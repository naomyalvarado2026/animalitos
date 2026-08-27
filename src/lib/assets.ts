/** Builds a public asset URL that works on Vercel and GitHub Pages subpaths. */
export function assetUrl(path: string): string {
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
