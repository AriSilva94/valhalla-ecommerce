import test from 'node:test';
import assert from 'node:assert/strict';

const SITE_URL = 'https://valhalla.example.com';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function makeRequest(ip: string, body: unknown, origin: string | null = SITE_URL): Request {
  const headers = new Headers({ 'Content-Type': 'application/json', 'x-forwarded-for': ip });
  if (origin) headers.set('Origin', origin);
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

test('login: 403 INVALID_ORIGIN when Origin does not match NEXT_PUBLIC_SITE_URL', async () => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { POST } = await import('./route');

  const req = makeRequest('1.1.1.1', { identifier: 'joe@example.com', password: 'password123' }, 'https://evil.example.com');
  const res = await POST(req);
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error, 'INVALID_ORIGIN');
});

test('login: successful login has no token fields in body, has user, and sets two HttpOnly cookies', async (t) => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  process.env.AUTH_COOKIE_SECURE = 'false';
  const { POST } = await import('./route');

  t.mock.method(globalThis, 'fetch', async () =>
    jsonResponse({
      jwt: 'access-token-value',
      refreshToken: 'refresh-token-value',
      user: { id: 1, username: 'joe', email: 'joe@example.com', confirmed: true, blocked: false, role: { name: 'authenticated' } },
    })
  );

  const req = makeRequest('2.2.2.2', { identifier: 'joe@example.com', password: 'password123' });
  const res = await POST(req);
  assert.equal(res.status, 200);

  const bodyText = JSON.stringify(await res.json());
  assert.doesNotMatch(bodyText, /access-token-value/);
  assert.doesNotMatch(bodyText, /refresh-token-value/);
  assert.match(bodyText, /"user"/);

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert.equal(setCookies.length, 2);
  assert.ok(setCookies.every((c) => c.includes('HttpOnly')));
  assert.ok(setCookies.some((c) => c.startsWith('valhalla_access=')));
  assert.ok(setCookies.some((c) => c.startsWith('valhalla_refresh=')));
});

test('login: cookies default to Secure when AUTH_COOKIE_SECURE is unset (fails closed, not open)', async (t) => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  delete process.env.AUTH_COOKIE_SECURE;
  const { POST } = await import('./route');

  t.mock.method(globalThis, 'fetch', async () =>
    jsonResponse({
      jwt: 'access-token-value',
      refreshToken: 'refresh-token-value',
      user: { id: 1, username: 'joe', email: 'joe@example.com', confirmed: true, blocked: false, role: { name: 'authenticated' } },
    })
  );

  const req = makeRequest('9.9.9.9', { identifier: 'joe@example.com', password: 'password123' });
  const res = await POST(req);
  assert.equal(res.status, 200);
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert.ok(setCookies.every((c) => c.includes('Secure')));

  process.env.AUTH_COOKIE_SECURE = 'false';
});

test('login: 429 after the configured limit is exceeded within the window', async () => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { POST } = await import('./route');

  const ip = '3.3.3.3';
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    jsonResponse({ error: { message: 'Invalid identifier or password' } }, 400)) as typeof fetch;

  try {
    let lastStatus = 0;
    for (let i = 0; i < 11; i += 1) {
      const req = makeRequest(ip, { identifier: 'joe@example.com', password: 'password123' });
      const res = await POST(req);
      lastStatus = res.status;
    }
    assert.equal(lastStatus, 429);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
