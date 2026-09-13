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

export async function handleConfirmEmail(
  confirmationToken: string,
  client: Pick<StrapiClient, 'confirmEmail'>
): Promise<AuthResult<null>> {
  return client.confirmEmail(confirmationToken);
}

export async function handleResendConfirmation(
  email: string,
  client: Pick<StrapiClient, 'resendConfirmation'>
): Promise<AuthResult<null>> {
  await client.resendConfirmation(email);
  return { ok: true, data: null };
}
