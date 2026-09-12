import test from 'node:test';
import assert from 'node:assert/strict';

// node:test cannot mock individual named exports of an ES module (the
// namespace object's properties are non-configurable), so these tests drive
// resolveSession end-to-end through a mocked global.fetch instead of mocking
// ./auth-strapi-client directly — same style as auth-strapi-client.test.ts.

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

const RAW_USER = {
  id: 1,
  username: 'joe',
  email: 'joe@example.com',
  confirmed: true,
  blocked: false,
  role: { name: 'authenticated' },
};

test('resolveSession: me() succeeds on the first try, no refresh attempted', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { resolveSession } = await import('./auth-session');

  let callCount = 0;
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    callCount += 1;
    assert.match(String(url), /\/api\/users\/me$/);
    return jsonResponse(RAW_USER);
  });

  const result = await resolveSession('valid-access-token', 'some-refresh-token');
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.refreshed, false);
    assert.equal(result.data.user.username, 'joe');
  }
  assert.equal(callCount, 1);
});

test('resolveSession: expired access token triggers exactly one refresh-then-retry', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { resolveSession } = await import('./auth-session');

  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    const path = String(url);
    calls.push(path);
    if (path.includes('/api/users/me')) {
      // First call fails (expired), second (after refresh) succeeds.
      const meCallsSoFar = calls.filter((c) => c.includes('/api/users/me')).length;
      if (meCallsSoFar === 1) return jsonResponse({ error: 'unauthorized' }, 401);
      return jsonResponse(RAW_USER);
    }
    if (path.includes('/api/auth/refresh')) {
      return jsonResponse({ jwt: 'new-access', refreshToken: 'new-refresh' });
    }
    throw new Error(`unexpected fetch: ${path}`);
  });

  const result = await resolveSession('expired-access-token', 'valid-refresh-token');
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.refreshed, true);
    assert.deepEqual(result.data.newTokens, { accessToken: 'new-access', refreshToken: 'new-refresh' });
  }
  const meCalls = calls.filter((c) => c.includes('/api/users/me'));
  const refreshCalls = calls.filter((c) => c.includes('/api/auth/refresh'));
  assert.equal(meCalls.length, 2);
  assert.equal(refreshCalls.length, 1);
});

test('resolveSession: does NOT retry a second time after the retry also fails', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { resolveSession } = await import('./auth-session');

  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    const path = String(url);
    calls.push(path);
    if (path.includes('/api/users/me')) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }
    if (path.includes('/api/auth/refresh')) {
      return jsonResponse({ jwt: 'new-access', refreshToken: 'new-refresh' });
    }
    throw new Error(`unexpected fetch: ${path}`);
  });

  const result = await resolveSession('expired-access-token', 'valid-refresh-token');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, 'UNAUTHENTICATED');
    assert.equal(result.status, 401);
  }
  const meCalls = calls.filter((c) => c.includes('/api/users/me'));
  const refreshCalls = calls.filter((c) => c.includes('/api/auth/refresh'));
  // me() is called once for the initial attempt and once for the retry after
  // refresh — never a third time.
  assert.equal(meCalls.length, 2);
  assert.equal(refreshCalls.length, 1);
});

test('resolveSession: refresh() itself failing does not retry me() again', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { resolveSession } = await import('./auth-session');

  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    const path = String(url);
    calls.push(path);
    if (path.includes('/api/users/me')) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }
    if (path.includes('/api/auth/refresh')) {
      return jsonResponse({ error: 'invalid refresh token' }, 400);
    }
    throw new Error(`unexpected fetch: ${path}`);
  });

  const result = await resolveSession('expired-access-token', 'invalid-refresh-token');
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, 'UNAUTHENTICATED');
  const meCalls = calls.filter((c) => c.includes('/api/users/me'));
  const refreshCalls = calls.filter((c) => c.includes('/api/auth/refresh'));
  assert.equal(meCalls.length, 1);
  assert.equal(refreshCalls.length, 1);
});

test('resolveSession: no access token but a refresh token attempts refresh directly', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { resolveSession } = await import('./auth-session');

  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    const path = String(url);
    calls.push(path);
    if (path.includes('/api/auth/refresh')) {
      return jsonResponse({ jwt: 'new-access', refreshToken: 'new-refresh' });
    }
    if (path.includes('/api/users/me')) {
      return jsonResponse(RAW_USER);
    }
    throw new Error(`unexpected fetch: ${path}`);
  });

  const result = await resolveSession(undefined, 'valid-refresh-token');
  assert.equal(result.ok, true);
  const meCalls = calls.filter((c) => c.includes('/api/users/me'));
  const refreshCalls = calls.filter((c) => c.includes('/api/auth/refresh'));
  assert.equal(refreshCalls.length, 1);
  assert.equal(meCalls.length, 1);
});

test('resolveSession: no access token and no refresh token is UNAUTHENTICATED without any call', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { resolveSession } = await import('./auth-session');

  let callCount = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    callCount += 1;
    throw new Error('should not be called');
  });

  const result = await resolveSession(undefined, undefined);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, 'UNAUTHENTICATED');
  assert.equal(callCount, 0);
});
