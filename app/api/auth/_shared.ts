import type { AuthCookieInstruction, OauthNonceCookieInstruction } from '../../lib/auth-cookies';
import { checkRateLimit, getRateLimitClient, type RateLimitResult } from '../../lib/redis';

type CookieInstruction = AuthCookieInstruction | OauthNonceCookieInstruction;

export { getClientIp, isOriginAllowed } from '../../lib/auth-request';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const SWEEP_THRESHOLD = 10000;

function sweepExpiredEntries(now: number): void {
  if (rateLimitStore.size <= SWEEP_THRESHOLD) return;
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt <= now) rateLimitStore.delete(key);
  }
}

function enforceLocalRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
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

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redisClient = getRateLimitClient();
  if (!redisClient) return enforceLocalRateLimit(key, limit, windowMs);

  return checkRateLimit(key, limit, Math.max(1, Math.ceil(windowMs / 1000)), redisClient);
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

export function jsonError(code: string, status: number, retryAfterSeconds?: number): Response {
  const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  if (retryAfterSeconds !== undefined) headers.set('Retry-After', String(retryAfterSeconds));
  return new Response(JSON.stringify({ ok: false, error: code }), {
    status,
    headers,
  });
}

export function jsonNoStore(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

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
