// Open-redirect guard. Only a same-origin relative path is ever accepted —
// anything else (protocol-relative `//`, an absolute URL, a backslash
// variant, or an embedded scheme) falls back, since browsers/proxies treat
// several of those shapes as absolute URLs pointing off-site.
export function safeRedirect(candidate: string | null | undefined, fallback: string): string {
  if (!candidate) return fallback;
  if (typeof candidate !== 'string') return fallback;
  if (candidate.length === 0) return fallback;
  if (!candidate.startsWith('/')) return fallback;
  if (candidate.startsWith('//')) return fallback;
  if (candidate.includes('\\')) return fallback;
  if (candidate.includes(':')) return fallback;
  return candidate;
}
