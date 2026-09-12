import type { AuthCookieInstruction, OauthNonceCookieInstruction } from '../../lib/auth-cookies';

type CookieInstruction = AuthCookieInstruction | OauthNonceCookieInstruction;

export { getClientIp, isOriginAllowed } from '../../lib/auth-request';

// In-memory rate limiter: a module-level Map is acceptable for this task
// (single Next.js server instance). Before deploying to Dokploy with more
// than one instance, this MUST be swapped for a shared store (e.g. Redis) —
// otherwise limits are per-instance, not global.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Simple, bounded eviction: this store never needs to be perfectly
// efficient (see the Redis note above — it's already a single-instance
// stopgap), it just must not grow unbounded when many distinct keys
// (e.g. distinct IPs) never come back to naturally overwrite their entry.
const SWEEP_THRESHOLD = 10000;

function sweepExpiredEntries(now: number): void {
  if (rateLimitStore.size <= SWEEP_THRESHOLD) return;
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt <= now) rateLimitStore.delete(key);
  }
}

export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  sweepExpiredEntries(now);
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true };
}

export function readAuthCookies(request: Request): {
  accessToken?: string;
  refreshToken?: string;
} {
  const header = request.headers.get('cookie');
  if (!header) return {};

  const cookies = new Map<string, string>();
  for (const part of header.split(';')) {
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) continue;
    const name = part.slice(0, eqIndex).trim();
    const value = part.slice(eqIndex + 1).trim();
    if (name) cookies.set(name, decodeURIComponent(value));
  }

  return {
    accessToken: cookies.get('valhalla_access'),
    refreshToken: cookies.get('valhalla_refresh'),
  };
}

function serializeCookie(instruction: CookieInstruction): string {
  const { name, value, options } = instruction;
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path}`);
  parts.push(`Max-Age=${options.maxAge}`);
  parts.push(`SameSite=Lax`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

export function jsonWithCookies(
  body: unknown,
  status: number,
  cookieInstructions: CookieInstruction[]
): Response {
  const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  for (const instruction of cookieInstructions) {
    headers.append('Set-Cookie', serializeCookie(instruction));
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export function jsonError(code: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error: code }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

// Plain success/no-cookie JSON response, still with Cache-Control: no-store
// — every auth response must never be cached, cookie-bearing or not.
export function jsonNoStore(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

// Same header-building logic as jsonWithCookies, but for a 302 redirect
// response instead of a JSON body — used by the OAuth routes, which must
// send the browser onward while still setting/clearing cookies.
export function redirectWithCookies(
  location: string,
  cookieInstructions: CookieInstruction[]
): Response {
  const headers = new Headers({ Location: location });
  for (const instruction of cookieInstructions) {
    headers.append('Set-Cookie', serializeCookie(instruction));
  }
  return new Response(null, { status: 302, headers });
}
