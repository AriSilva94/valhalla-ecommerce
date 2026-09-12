// Thin orchestration functions for route handlers (Task 4/5). Each takes
// already-validated input plus the Strapi client and returns an AuthResult —
// no request parsing, cookie writing, or origin checks happen here.

import type { AuthResult, AuthUser } from './auth-contracts';
import type { AuthTokens } from './auth-cookies';
import type * as strapiClient from './auth-strapi-client';

type StrapiClient = typeof strapiClient;

export async function handleLogin(
  identifier: string,
  password: string,
  client: Pick<StrapiClient, 'login'>
): Promise<AuthResult<{ tokens: AuthTokens; user: AuthUser }>> {
  return client.login(identifier, password);
}

export async function handleRegister(
  username: string,
  email: string,
  password: string,
  client: Pick<StrapiClient, 'register'>
): Promise<AuthResult<{ tokens: AuthTokens; user: AuthUser }>> {
  return client.register(username, email, password);
}

export async function handleLogout(
  accessToken: string,
  client: Pick<StrapiClient, 'logout'>
): Promise<AuthResult<null>> {
  // Best-effort revocation: even if Strapi fails to revoke the session
  // server-side, the caller still clears cookies — logout must never fail
  // visibly to the browser.
  const result = await client.logout(accessToken);
  if (!result.ok) {
    return { ok: true, data: null };
  }
  return result;
}

export async function handleForgotPassword(
  email: string,
  client: Pick<StrapiClient, 'forgotPassword'>
): Promise<AuthResult<null>> {
  // Neutral response regardless of outcome — never reveal whether the email
  // exists, and swallow unrelated upstream errors (network/timeout) too.
  await client.forgotPassword(email);
  return { ok: true, data: null };
}

export async function handleResetPassword(
  code: string,
  password: string,
  passwordConfirmation: string,
  client: Pick<StrapiClient, 'resetPassword'>
): Promise<AuthResult<null>> {
  return client.resetPassword(code, password, passwordConfirmation);
}

export async function handleResendConfirmation(
  email: string,
  client: Pick<StrapiClient, 'resendConfirmation'>
): Promise<AuthResult<null>> {
  // Same neutrality rule as handleForgotPassword.
  await client.resendConfirmation(email);
  return { ok: true, data: null };
}
