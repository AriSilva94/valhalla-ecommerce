// This file lives under a Next.js dynamic-segment directory ([nonce]).
// Node's --test glob treats square brackets as character-class syntax, so
// package.json's "app/api/**/*.test.ts" pattern silently never matches
// this file — it's listed there as an explicit extra path instead. Any
// future test under another [param] directory needs the same treatment.
import test from 'node:test';
import assert from 'node:assert/strict';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function makeRequest(url: string, cookie?: string): Request {
  const headers = new Headers();
  if (cookie) headers.set('cookie', cookie);
  return new Request(url, { method: 'GET', headers });
}

function params(nonce: string) {
  return { params: Promise.resolve({ nonce }) };
}

test('callback: missing nonce cookie redirects to /entrar?error=oauth_failed', async () => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { GET } = await import('./route');

  const res = await GET(
    makeRequest('http://localhost/api/auth/google/callback/nonce123?access_token=abc'),
    params('nonce123')
  );
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/entrar?error=oauth_failed');
});

test('callback: valid matching nonce + successful googleCallback sets cookies and redirects to validated returnTo', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  process.env.AUTH_COOKIE_SECURE = 'false';
  const { GET } = await import('./route');

  const fetchMock = t.mock.method(globalThis, 'fetch', async () =>
    jsonResponse({
      jwt: 'access-token-value',
      refreshToken: 'refresh-token-value',
      user: { id: 1, username: 'joe', email: 'joe@example.com', confirmed: true, blocked: false, role: { name: 'authenticated' } },
    })
  );

  const cookieValue = `nonce123:${encodeURIComponent('/minha-conta')}`;
  const req = makeRequest(
    'http://localhost/api/auth/google/callback/nonce123?access_token=abc',
    `valhalla_oauth_nonce=${encodeURIComponent(cookieValue)}`
  );
  const res = await GET(req, params('nonce123'));

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/minha-conta');
  assert.equal(fetchMock.mock.callCount(), 1);

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert.ok(setCookies.some((c) => c.startsWith('valhalla_access=')));
  assert.ok(setCookies.some((c) => c.startsWith('valhalla_refresh=')));
  assert.ok(setCookies.some((c) => c.startsWith('valhalla_oauth_nonce=') && c.includes('Max-Age=0')));

  const bodyText = setCookies.join('\n');
  assert.doesNotMatch(bodyText, /access-token-value$/m);
});

// Regression test for the real bug: Strapi's grant middleware appends its
// own `?id_token=...&access_token=...&raw[...]=...` querystring onto
// whatever `callback` URL it's given, via blind string concatenation
// (`${callback}?${qs.stringify(output)}`) rather than a merge. When the
// nonce lived in a `?state=` query param, this produced a callback URL
// like `?state=<nonce>?id_token=...`, corrupting the nonce value and
// making every real Google login fail. Simulate that same mangled
// suffix landing on the path-based route to prove it no longer breaks
// nonce comparison: the nonce is a clean path segment, and the mangled
// junk grant appends is fully contained inside the query string, which
// this route never reads except for `access_token`.
test('callback: survives grant appending its raw provider payload after the nonce path segment', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  process.env.AUTH_COOKIE_SECURE = 'false';
  const { GET } = await import('./route');

  t.mock.method(globalThis, 'fetch', async () =>
    jsonResponse({
      jwt: 'access-token-value',
      refreshToken: 'refresh-token-value',
      user: { id: 1, username: 'joe', email: 'joe@example.com', confirmed: true, blocked: false, role: { name: 'authenticated' } },
    })
  );

  const cookieValue = `nonce123:${encodeURIComponent('/')}`;
  const mangledQuery =
    '?id_token=eyJhbGciOi...&access_token=ya29.real-token&raw%5Baccess_token%5D=ya29.real-token&raw%5Bscope%5D=email+openid';
  const req = makeRequest(
    `http://localhost/api/auth/google/callback/nonce123${mangledQuery}`,
    `valhalla_oauth_nonce=${encodeURIComponent(cookieValue)}`
  );
  const res = await GET(req, params('nonce123'));

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/');
});

test('callback: forged/mismatched nonce is rejected before any token exchange is attempted', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  process.env.AUTH_COOKIE_SECURE = 'false';
  const { GET } = await import('./route');

  const fetchMock = t.mock.method(globalThis, 'fetch', async () =>
    jsonResponse({
      jwt: 'access-token-value',
      refreshToken: 'refresh-token-value',
      user: { id: 1, username: 'joe', email: 'joe@example.com', confirmed: true, blocked: false, role: { name: 'authenticated' } },
    })
  );

  const cookieValue = `nonce123:${encodeURIComponent('/minha-conta')}`;
  const req = makeRequest(
    'http://localhost/api/auth/google/callback/forged-nonce?access_token=abc',
    `valhalla_oauth_nonce=${encodeURIComponent(cookieValue)}`
  );
  const res = await GET(req, params('forged-nonce'));

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/entrar?error=oauth_failed');
  assert.equal(fetchMock.mock.callCount(), 0);

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert.ok(setCookies.some((c) => c.startsWith('valhalla_oauth_nonce=') && c.includes('Max-Age=0')));
  assert.ok(!setCookies.some((c) => c.startsWith('valhalla_access=')));
});

test('callback: invalid returnTo (protocol-relative) falls back to "/"', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  process.env.AUTH_COOKIE_SECURE = 'false';
  const { GET } = await import('./route');

  t.mock.method(globalThis, 'fetch', async () =>
    jsonResponse({
      jwt: 'access-token-value',
      refreshToken: 'refresh-token-value',
      user: { id: 1, username: 'joe', email: 'joe@example.com', confirmed: true, blocked: false, role: { name: 'authenticated' } },
    })
  );

  const cookieValue = `nonce123:${encodeURIComponent('//evil.example.com')}`;
  const req = makeRequest(
    'http://localhost/api/auth/google/callback/nonce123?access_token=abc',
    `valhalla_oauth_nonce=${encodeURIComponent(cookieValue)}`
  );
  const res = await GET(req, params('nonce123'));

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/');
});

test('callback: googleCallback failure redirects to error page and clears nonce', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { GET } = await import('./route');

  t.mock.method(globalThis, 'fetch', async () => jsonResponse({ error: 'bad token' }, 401));

  const cookieValue = `nonce123:${encodeURIComponent('/')}`;
  const req = makeRequest(
    'http://localhost/api/auth/google/callback/nonce123?access_token=bad',
    `valhalla_oauth_nonce=${encodeURIComponent(cookieValue)}`
  );
  const res = await GET(req, params('nonce123'));

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/entrar?error=oauth_failed');
});
