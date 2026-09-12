import test from 'node:test';
import assert from 'node:assert/strict';

import {
  handleForgotPassword,
  handleLogin,
  handleLogout,
  handleRegister,
  handleResendConfirmation,
  handleResetPassword,
} from './auth-handlers';

const USER = { id: 1, username: 'joe', email: 'joe@example.com', confirmed: true, blocked: false, role: 'authenticated' };
const TOKENS = { accessToken: 'a', refreshToken: 'r' };

test('handleLogin: delegates to the client and passes through the result', async () => {
  const client = { login: async () => ({ ok: true as const, data: { tokens: TOKENS, user: USER } }) };
  const result = await handleLogin('joe@example.com', 'password123', client);
  assert.equal(result.ok, true);
});

test('handleLogin: passes through a failure unchanged', async () => {
  const client = { login: async () => ({ ok: false as const, error: 'INVALID_CREDENTIALS', status: 401 }) };
  const result = await handleLogin('joe@example.com', 'wrong', client);
  assert.deepEqual(result, { ok: false, error: 'INVALID_CREDENTIALS', status: 401 });
});

test('handleRegister: delegates to the client', async () => {
  const client = { register: async () => ({ ok: true as const, data: { tokens: TOKENS, user: USER } }) };
  const result = await handleRegister('joe', 'joe@example.com', 'password123', client);
  assert.equal(result.ok, true);
});

test('handleLogout: success passes through', async () => {
  const client = { logout: async () => ({ ok: true as const, data: null }) };
  const result = await handleLogout('access-token', client);
  assert.deepEqual(result, { ok: true, data: null });
});

test('handleLogout: Strapi failure is swallowed to a neutral success', async () => {
  const client = { logout: async () => ({ ok: false as const, error: 'UPSTREAM_ERROR', status: 502 }) };
  const result = await handleLogout('access-token', client);
  assert.deepEqual(result, { ok: true, data: null });
});

test('handleForgotPassword: always returns neutral success on Strapi success', async () => {
  const client = { forgotPassword: async () => ({ ok: true as const, data: null }) };
  const result = await handleForgotPassword('exists@example.com', client);
  assert.deepEqual(result, { ok: true, data: null });
});

test('handleForgotPassword: always returns neutral success even when Strapi errors (no enumeration)', async () => {
  const client = {
    forgotPassword: async () => ({ ok: false as const, error: 'UPSTREAM_ERROR', status: 502 }),
  };
  const result = await handleForgotPassword('does-not-exist@example.com', client);
  assert.deepEqual(result, { ok: true, data: null });
});

test('handleResendConfirmation: always returns neutral success even when Strapi errors', async () => {
  const client = {
    resendConfirmation: async () => ({ ok: false as const, error: 'UPSTREAM_ERROR', status: 502 }),
  };
  const result = await handleResendConfirmation('does-not-exist@example.com', client);
  assert.deepEqual(result, { ok: true, data: null });
});

test('handleResetPassword: passes through success and failure', async () => {
  const okClient = { resetPassword: async () => ({ ok: true as const, data: null }) };
  const okResult = await handleResetPassword('code', 'password123', 'password123', okClient);
  assert.deepEqual(okResult, { ok: true, data: null });

  const failClient = {
    resetPassword: async () => ({ ok: false as const, error: 'VALIDATION_ERROR', status: 400 }),
  };
  const failResult = await handleResetPassword('bad-code', 'password123', 'password123', failClient);
  assert.deepEqual(failResult, { ok: false, error: 'VALIDATION_ERROR', status: 400 });
});
