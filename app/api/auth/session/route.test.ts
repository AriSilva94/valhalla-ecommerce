import test from 'node:test';
import assert from 'node:assert/strict';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function makeRequest(cookie?: string): Request {
  const headers = new Headers();
  if (cookie) headers.set('Cookie', cookie);
  return new Request('http://localhost/api/auth/session', { method: 'GET', headers });
}

test('session: valid cookies -> 200 with user', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  process.env.AUTH_COOKIE_SECURE = 'false';
  const { GET } = await import('./route');

  t.mock.method(globalThis, 'fetch', async (url: string) => {
    assert.match(String(url), /\/api\/users\/me$/);
    return jsonResponse({ id: 1, username: 'joe', email: 'joe@example.com', confirmed: true, blocked: false, role: { name: 'authenticated' } });
  });

  const req = makeRequest('valhalla_access=valid-access; valhalla_refresh=valid-refresh');
  const res = await GET(req);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.user.username, 'joe');
});

test('session: expired access + valid refresh -> 200 with refreshed cookies set', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  process.env.AUTH_COOKIE_SECURE = 'false';
  const { GET } = await import('./route');

  let meCalls = 0;
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    const path = String(url);
    if (path.includes('/api/users/me')) {
      meCalls += 1;
      if (meCalls === 1) return jsonResponse({ error: 'unauthorized' }, 401);
      return jsonResponse({ id: 1, username: 'joe', email: 'joe@example.com', confirmed: true, blocked: false, role: { name: 'authenticated' } });
    }
    if (path.includes('/api/auth/refresh')) {
      return jsonResponse({ jwt: 'new-access', refreshToken: 'new-refresh' });
    }
    throw new Error(`unexpected fetch: ${path}`);
  });

  const req = makeRequest('valhalla_access=expired-access; valhalla_refresh=valid-refresh');
  const res = await GET(req);
  assert.equal(res.status, 200);

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert.equal(setCookies.length, 2);
  assert.ok(setCookies.some((c) => c.includes('new-access')));
  assert.ok(setCookies.some((c) => c.includes('new-refresh')));
});

test('session: upstream failure -> forwards status/error, does not clear cookies', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  process.env.AUTH_COOKIE_SECURE = 'false';
  const { GET } = await import('./route');

  t.mock.method(globalThis, 'fetch', async (url: string) => {
    const path = String(url);
    if (path.includes('/api/users/me')) return jsonResponse({ error: 'service unavailable' }, 503);
    throw new Error(`unexpected fetch: ${path}`);
  });

  const req = makeRequest('valhalla_access=some-access');
  const res = await GET(req);
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error, 'UPSTREAM_ERROR');

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert.equal(setCookies.length, 0);
});

test('session: both invalid -> 401 with cookies cleared', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  process.env.AUTH_COOKIE_SECURE = 'false';
  const { GET } = await import('./route');

  t.mock.method(globalThis, 'fetch', async (url: string) => {
    const path = String(url);
    if (path.includes('/api/users/me')) return jsonResponse({ error: 'unauthorized' }, 401);
    if (path.includes('/api/auth/refresh')) return jsonResponse({ error: 'invalid' }, 400);
    throw new Error(`unexpected fetch: ${path}`);
  });

  const req = makeRequest('valhalla_access=bad-access; valhalla_refresh=bad-refresh');
  const res = await GET(req);
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error, 'UNAUTHENTICATED');

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert.equal(setCookies.length, 2);
  assert.ok(setCookies.every((c) => c.includes('Max-Age=0')));
});
