export function isOriginAllowed(request: Request, publicSiteUrl: string): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return origin === publicSiteUrl;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (!forwardedFor) return 'unknown';
  const first = forwardedFor.split(',')[0]?.trim();
  return first || 'unknown';
}
