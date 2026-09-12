import type { AuthCookieInstruction } from '../../lib/auth-cookies';

export { getClientIp, isOriginAllowed } from '../../lib/auth-request';

// In-memory rate limiter: a module-level Map is acceptable for this task
// (single Next.js server instance). Before deploying to Dokploy with more
// than one instance, this MUST be swapped for a shared store (e.g. Redis) —
// otherwise limits are per-instance, not global.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
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

function serializeCookie(instruction: AuthCookieInstruction): string {
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
  cookieInstructions: AuthCookieInstruction[]
): Response {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const instruction of cookieInstructions) {
    headers.append('Set-Cookie', serializeCookie(instruction));
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export function jsonError(code: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error: code }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
