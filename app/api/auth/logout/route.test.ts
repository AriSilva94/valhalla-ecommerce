import test from 'node:test';
import assert from 'node:assert/strict';

const SITE_URL = 'https://valhalla.example.com';

function makeRequest(cookie?: string): Request {
  const headers = new Headers({ Origin: SITE_URL });
  if (cookie) headers.set('Cookie', cookie);
  return new Request('http://localhost/api/auth/logout', { method: 'POST', headers });
}

test('logout: cookies are cleared (maxAge 0) even when the upstream Strapi call fails', async (t) => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  process.env.AUTH_COOKIE_SECURE = 'false';
  const { POST } = await import('./route');

  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: 'upstream down' }), { status: 502 }));

  const req = makeRequest('valhalla_access=abc; valhalla_refresh=def');
  const res = await POST(req);
  assert.equal(res.status, 200);

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert.equal(setCookies.length, 2);
  assert.ok(setCookies.every((c) => c.includes('Max-Age=0')));
});

test('logout: 403 INVALID_ORIGIN on mismatched origin', async () => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
  const { POST } = await import('./route');
  const req = new Request('http://localhost/api/auth/logout', {
    method: 'POST',
    headers: { Origin: 'https://evil.example.com' },
  });
  const res = await POST(req);
  assert.equal(res.status, 403);
});
