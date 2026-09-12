import type { AuthResult, AuthUser } from './auth-contracts';
import { AUTH_ERROR_CODES } from './auth-contracts';
import type { AuthTokens } from './auth-cookies';
import * as strapiClient from './auth-strapi-client';

export type ResolveSessionResult = {
  user: AuthUser;
  refreshed: boolean;
  newTokens?: AuthTokens;
};

export async function resolveSession(
  accessToken: string | undefined,
  refreshToken: string | undefined
): Promise<AuthResult<ResolveSessionResult>> {
  if (!accessToken) {
    if (!refreshToken) {
      return { ok: false, error: AUTH_ERROR_CODES.UNAUTHENTICATED, status: 401 };
    }
    return attemptRefreshAndRetry(refreshToken);
  }

  const meResult = await strapiClient.me(accessToken);
  if (meResult.ok) {
    return { ok: true, data: { user: meResult.data.user, refreshed: false } };
  }

  if (meResult.status !== 401) {
    // Non-401 failures (upstream/network errors, etc.) are forwarded as-is
    // regardless of refresh-token availability — there is nothing a
    // refresh could fix here, and the caller should not clear otherwise
    // possibly-valid cookies over a transient upstream issue.
    return meResult;
  }

  if (!refreshToken) {
    // The access token is genuinely invalid/expired (401) and there is no
    // refresh path to recover it — this must reliably become
    // UNAUTHENTICATED (not meResult's raw INVALID_CREDENTIALS) so that
    // session/route.ts clears the now-useless auth cookies instead of
    // leaving them stuck forever.
    return { ok: false, error: AUTH_ERROR_CODES.UNAUTHENTICATED, status: 401 };
  }

  // Exactly one refresh-then-retry attempt — never loop.
  return attemptRefreshAndRetry(refreshToken);
}

async function attemptRefreshAndRetry(
  refreshToken: string
): Promise<AuthResult<ResolveSessionResult>> {
  const refreshResult = await strapiClient.refresh(refreshToken);
  if (!refreshResult.ok) {
    return { ok: false, error: AUTH_ERROR_CODES.UNAUTHENTICATED, status: 401 };
  }

  const retryResult = await strapiClient.me(refreshResult.data.tokens.accessToken);
  if (!retryResult.ok) {
    return { ok: false, error: AUTH_ERROR_CODES.UNAUTHENTICATED, status: 401 };
  }

  return {
    ok: true,
    data: {
      user: retryResult.data.user,
      refreshed: true,
      newTokens: refreshResult.data.tokens,
    },
  };
}
