export function isOriginAllowed(request: Request, publicSiteUrl: string): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return origin === publicSiteUrl;
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
