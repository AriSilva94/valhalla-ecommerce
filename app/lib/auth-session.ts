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
    return meResult;
  }

  if (!refreshToken) {
    return { ok: false, error: AUTH_ERROR_CODES.UNAUTHENTICATED, status: 401 };
  }

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
