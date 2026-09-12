// Server-only Strapi client for authentication. Never import this from a
// client component — it reads STRAPI_INTERNAL_URL (no NEXT_PUBLIC_ prefix)
// and every call carries no browser-visible secrets.

import type { AuthResult, AuthUser } from './auth-contracts';
import { AUTH_ERROR_CODES } from './auth-contracts';
import type { AuthTokens } from './auth-cookies';

export type { AuthUser } from './auth-contracts';
export type { AuthTokens } from './auth-cookies';

const REQUEST_TIMEOUT_MS = 10000;

function getBaseUrl(): string {
  const raw = process.env.STRAPI_INTERNAL_URL || process.env.STRAPI_URL;
  if (!raw || !raw.trim()) {
    throw new Error('STRAPI_INTERNAL_URL is not set');
  }
  return raw.trim().replace(/\/+$/, '');
}

// Extracts the upstream error message from a Strapi users-permissions 400
// body, whatever shape it comes in — `{ error: "message" }` (the shape
// already assumed by this file's tests) as well as the plugin's real
// `{ error: { message: "..." } }` / `{ message: "..." }` shapes. Returns
// '' when nothing usable is found; never throws.
function extractStrapiErrorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const anyBody = body as Record<string, unknown>;
  if (typeof anyBody.error === 'string') return anyBody.error;
  if (anyBody.error && typeof anyBody.error === 'object') {
    const nested = (anyBody.error as Record<string, unknown>).message;
    if (typeof nested === 'string') return nested;
  }
  if (typeof anyBody.message === 'string') return anyBody.message;
  if (Array.isArray(anyBody.message) && anyBody.message[0]) {
    const first = anyBody.message[0] as Record<string, unknown>;
    const messages = first.messages;
    if (Array.isArray(messages) && messages[0]) {
      const messageText = (messages[0] as Record<string, unknown>).message;
      if (typeof messageText === 'string') return messageText;
    }
  }
  return '';
}

// Maps Strapi's actual 400 error message to one of our fixed, stable error
// codes. This is the ONLY place upstream message text is inspected — the
// raw text itself is never forwarded to the browser, only the mapped code.
function mapValidationMessage(message: string): string {
  const normalized = message.toLowerCase();
  if (
    normalized.includes('invalid identifier or password') ||
    (normalized.includes('invalid') && normalized.includes('password'))
  ) {
    return AUTH_ERROR_CODES.INVALID_CREDENTIALS;
  }
  if (normalized.includes('not confirmed') || normalized.includes('email is not confirmed')) {
    return AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED;
  }
  return AUTH_ERROR_CODES.VALIDATION_ERROR;
}

type RawStrapiUser = {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  role?: { name?: string } | string | null;
};

function toAuthUser(raw: RawStrapiUser): AuthUser {
  // A null/missing role from Strapi means the user genuinely has no role;
  // defaulting it to 'authenticated' would make it indistinguishable from a
  // real authenticated role, so we default to '' (falsy, distinguishable).
  const role = typeof raw.role === 'string' ? raw.role : raw.role?.name ?? '';
  return {
    id: raw.id,
    username: raw.username,
    email: raw.email,
    confirmed: raw.confirmed,
    blocked: raw.blocked,
    role,
  };
}

function toAuthTokens(json: { jwt?: string; refreshToken?: string; refresh_token?: string }): AuthTokens {
  return {
    accessToken: json.jwt ?? '',
    refreshToken: json.refreshToken ?? json.refresh_token ?? '',
  };
}

function errorResult<T>(error: string, status: number): AuthResult<T> {
  return { ok: false, error, status };
}

async function request<T>(
  path: string,
  init: RequestInit
): Promise<AuthResult<T>> {
  let baseUrl: string;
  try {
    baseUrl = getBaseUrl();
  } catch {
    // Never leak the raw error message (it never contains a token, but keep
    // the shape consistent with other failure paths regardless).
    return errorResult(AUTH_ERROR_CODES.UPSTREAM_ERROR, 500);
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    // Network failure or timeout (AbortSignal.timeout) both land here.
    return errorResult(AUTH_ERROR_CODES.UPSTREAM_ERROR, 502);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return errorResult(AUTH_ERROR_CODES.INVALID_CREDENTIALS, 401);
    }
    if (res.status === 400) {
      let code: string = AUTH_ERROR_CODES.VALIDATION_ERROR;
      try {
        const body = await res.json();
        const message = extractStrapiErrorMessage(body);
        if (message) code = mapValidationMessage(message);
      } catch {
        // No parseable body — fall back to the generic validation code.
      }
      return errorResult(code, 400);
    }
    return errorResult(AUTH_ERROR_CODES.UPSTREAM_ERROR, 502);
  }

  try {
    const json = (await res.json()) as T;
    return { ok: true, data: json };
  } catch {
    return errorResult(AUTH_ERROR_CODES.UPSTREAM_ERROR, 502);
  }
}

function jsonInit(body: unknown, headers?: Record<string, string>): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  };
}

export async function login(
  identifier: string,
  password: string
): Promise<AuthResult<{ tokens: AuthTokens; user: AuthUser }>> {
  const result = await request<{ jwt: string; user: RawStrapiUser }>(
    '/api/auth/local',
    jsonInit({ identifier, password })
  );
  if (!result.ok) return result;
  return {
    ok: true,
    data: { tokens: toAuthTokens(result.data), user: toAuthUser(result.data.user) },
  };
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResult<{ tokens: AuthTokens; user: AuthUser }>> {
  const result = await request<{ jwt: string; user: RawStrapiUser }>(
    '/api/auth/local/register',
    jsonInit({ username, email, password })
  );
  if (!result.ok) return result;
  return {
    ok: true,
    data: { tokens: toAuthTokens(result.data), user: toAuthUser(result.data.user) },
  };
}

export async function me(accessToken: string): Promise<AuthResult<{ user: AuthUser }>> {
  const result = await request<RawStrapiUser>('/api/users/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!result.ok) return result;
  return { ok: true, data: { user: toAuthUser(result.data) } };
}

export async function refresh(
  refreshToken: string
): Promise<AuthResult<{ tokens: AuthTokens }>> {
  const result = await request<{ jwt: string; refreshToken?: string }>(
    '/api/auth/refresh',
    jsonInit({ refreshToken })
  );
  if (!result.ok) return result;
  return { ok: true, data: { tokens: toAuthTokens(result.data) } };
}

export async function logout(accessToken: string): Promise<AuthResult<null>> {
  const result = await request<unknown>('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!result.ok) return result;
  return { ok: true, data: null };
}

export async function forgotPassword(email: string): Promise<AuthResult<null>> {
  const result = await request<unknown>('/api/auth/forgot-password', jsonInit({ email }));
  if (!result.ok) return result;
  return { ok: true, data: null };
}

export async function resetPassword(
  code: string,
  password: string,
  passwordConfirmation: string
): Promise<AuthResult<null>> {
  const result = await request<unknown>(
    '/api/auth/reset-password',
    jsonInit({ code, password, passwordConfirmation })
  );
  if (!result.ok) return result;
  return { ok: true, data: null };
}

export async function resendConfirmation(email: string): Promise<AuthResult<null>> {
  const result = await request<unknown>(
    '/api/auth/send-email-confirmation',
    jsonInit({ email })
  );
  if (!result.ok) return result;
  return { ok: true, data: null };
}

// Strapi's users-permissions email-confirmation endpoint is a browser-facing
// GET route: on success it 30x-redirects to the configured
// `email_confirmation_redirection` URL, it doesn't return JSON. The BFF
// calls it server-side with redirect: 'manual' so the confirmation token
// never reaches the browser (spec: "o BFF encaminha a confirmação ao Strapi
// sem expor o token") and treats a redirect response as success.
export async function confirmEmail(confirmationToken: string): Promise<AuthResult<null>> {
  let baseUrl: string;
  try {
    baseUrl = getBaseUrl();
  } catch {
    return errorResult(AUTH_ERROR_CODES.UPSTREAM_ERROR, 500);
  }

  let res: Response;
  try {
    res = await fetch(
      `${baseUrl}/api/auth/email-confirmation?confirmation=${encodeURIComponent(confirmationToken)}`,
      { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );
  } catch {
    return errorResult(AUTH_ERROR_CODES.UPSTREAM_ERROR, 502);
  }

  if (res.status >= 300 && res.status < 400) {
    return { ok: true, data: null };
  }
  if (res.status === 400) {
    return errorResult(AUTH_ERROR_CODES.VALIDATION_ERROR, 400);
  }
  return errorResult(AUTH_ERROR_CODES.UPSTREAM_ERROR, 502);
}

export async function googleCallback(
  accessTokenFromGoogle: string
): Promise<AuthResult<{ tokens: AuthTokens; user: AuthUser }>> {
  const result = await request<{ jwt: string; user: RawStrapiUser }>(
    `/api/auth/google/callback?access_token=${encodeURIComponent(accessTokenFromGoogle)}`,
    { method: 'GET' }
  );
  if (!result.ok) return result;
  return {
    ok: true,
    data: { tokens: toAuthTokens(result.data), user: toAuthUser(result.data.user) },
  };
}
