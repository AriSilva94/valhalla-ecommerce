export function isOriginAllowed(request: Request, publicSiteUrl: string): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return origin === publicSiteUrl;
}

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
  const last = hops[hops.length - 1];
  return last || 'unknown';
}
