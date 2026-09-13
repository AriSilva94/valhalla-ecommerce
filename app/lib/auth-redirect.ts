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
