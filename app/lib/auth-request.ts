export function isOriginAllowed(request: Request, publicSiteUrl: string): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return origin === publicSiteUrl;
}

// Origin-check normalization is deliberately separate from site-url.ts's
// getSiteUrl(): that one enforces https for SEO/canonical purposes (correct
// for og:url etc.), but the browser's Origin header is legitimately
// http://localhost:PORT in local dev — enforcing https here would reject
// every same-origin request outside production.
export function getAllowedOrigin(env: Record<string, string | undefined> = process.env): string {
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return '';
  try {
    return new URL(raw).origin;
  } catch {
    return '';
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (!forwardedFor) return 'unknown';
  const hops = forwardedFor.split(',').map((hop) => hop.trim()).filter(Boolean);
  // Take the RIGHTMOST hop, not the leftmost: in a reverse-proxy setup
  // (Traefik/Dokploy-style), the proxy appends the real client IP as the
  // last hop, while every entry before it is attacker-controlled (a client
  // can freely set its own X-Forwarded-For header with arbitrary values).
  const last = hops[hops.length - 1];
  return last || 'unknown';
}
