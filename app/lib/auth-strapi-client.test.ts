import test from 'node:test';
import assert from 'node:assert/strict';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

test('login: success maps tokens and user', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { login } = await import('./auth-strapi-client');

  t.mock.method(globalThis, 'fetch', async () =>
    jsonResponse({
      jwt: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 1, username: 'joe', email: 'joe@example.com', confirmed: true, blocked: false, role: { name: 'authenticated' } },
    })
  );

  const result = await login('joe@example.com', 'password123');
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data.tokens, { accessToken: 'access-token', refreshToken: 'refresh-token' });
    assert.equal(result.data.user.email, 'joe@example.com');
    assert.equal(result.data.user.role, 'authenticated');
  }
});

test('login: 400 from Strapi maps to VALIDATION_ERROR', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { login } = await import('./auth-strapi-client');

  t.mock.method(globalThis, 'fetch', async () => jsonResponse({ error: 'Invalid identifier or password' }, 400));

  const result = await login('joe@example.com', 'wrong');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, 'VALIDATION_ERROR');
    assert.equal(result.status, 400);
  }
});

test('login: real 401 status maps to INVALID_CREDENTIALS', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { login } = await import('./auth-strapi-client');

  t.mock.method(globalThis, 'fetch', async () => jsonResponse({ error: 'unauthorized' }, 401));

  const result = await login('joe@example.com', 'wrong');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, 'INVALID_CREDENTIALS');
    assert.equal(result.status, 401);
  }
});

test('login: network failure maps to UPSTREAM_ERROR, never rethrows', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { login } = await import('./auth-strapi-client');

  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('ECONNREFUSED');
  });

  const result = await login('joe@example.com', 'password123');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, 'UPSTREAM_ERROR');
    assert.equal(result.status, 502);
  }
});

test('login: timeout (AbortSignal.timeout firing) maps to UPSTREAM_ERROR', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { login } = await import('./auth-strapi-client');

  t.mock.method(globalThis, 'fetch', async () => {
    const err = new DOMException('The operation was aborted', 'TimeoutError');
    throw err;
  });

  const result = await login('joe@example.com', 'password123');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, 'UPSTREAM_ERROR');
  }
});

test('login: STRAPI_INTERNAL_URL unset throws a clear error at call time, not import time', async () => {
  delete process.env.STRAPI_INTERNAL_URL;
  const { login } = await import('./auth-strapi-client');

  const result = await login('joe@example.com', 'password123');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, 'UPSTREAM_ERROR');
  }

  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
});

test('login: null role from Strapi maps to empty string, not "authenticated"', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { login } = await import('./auth-strapi-client');

  t.mock.method(globalThis, 'fetch', async () =>
    jsonResponse({
      jwt: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 1, username: 'joe', email: 'joe@example.com', confirmed: true, blocked: false, role: null },
    })
  );

  const result = await login('joe@example.com', 'password123');
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.user.role, '');
  }
});

test('me: success returns the user only', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { me } = await import('./auth-strapi-client');

  t.mock.method(globalThis, 'fetch', async () =>
    jsonResponse({ id: 2, username: 'ana', email: 'ana@example.com', confirmed: true, blocked: false, role: { name: 'authenticated' } })
  );

  const result = await me('some-access-token');
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.user.username, 'ana');
  }
});

test('me: 401 maps to INVALID_CREDENTIALS and never echoes the token', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { me } = await import('./auth-strapi-client');

  t.mock.method(globalThis, 'fetch', async () => jsonResponse({ error: 'unauthorized' }, 401));

  const result = await me('expired-token');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, 'INVALID_CREDENTIALS');
    assert.equal(result.status, 401);
    assert.doesNotMatch(JSON.stringify(result), /expired-token/);
  }
});

test('me: network failure maps to UPSTREAM_ERROR', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { me } = await import('./auth-strapi-client');

  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('network down');
  });

  const result = await me('some-access-token');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, 'UPSTREAM_ERROR');
  }
});

test('confirmEmail: a redirect response from Strapi is treated as success', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { confirmEmail } = await import('./auth-strapi-client');

  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(null, {
        status: 302,
        headers: { Location: 'https://frontend.example.com/auth/email-confirmed' },
      })
  );

  const result = await confirmEmail('some-confirmation-token');
  assert.equal(result.ok, true);
});

test('confirmEmail: 400 from Strapi maps to VALIDATION_ERROR', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { confirmEmail } = await import('./auth-strapi-client');

  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 400 }));

  const result = await confirmEmail('bad-token');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, 'VALIDATION_ERROR');
  }
});

test('me: timeout maps to UPSTREAM_ERROR', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { me } = await import('./auth-strapi-client');

  t.mock.method(globalThis, 'fetch', async () => {
    throw new DOMException('The operation was aborted', 'TimeoutError');
  });

  const result = await me('some-access-token');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, 'UPSTREAM_ERROR');
  }
});
