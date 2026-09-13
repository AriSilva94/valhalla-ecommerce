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

test('callback: missing nonce cookie redirects to /entrar?error=oauth_failed', async () => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { GET } = await import('./route');

  const res = await GET(
    makeRequest('http://localhost/api/auth/google/callback?access_token=abc&state=nonce123')
  );
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/entrar?error=oauth_failed');
});

test('callback: valid matching state + successful googleCallback sets cookies and redirects to validated returnTo', async (t) => {
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
    'http://localhost/api/auth/google/callback?access_token=abc&state=nonce123',
    `valhalla_oauth_nonce=${encodeURIComponent(cookieValue)}`
  );
  const res = await GET(req);

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

test('callback: recovers the plain nonce and access_token from state mangled by grant', async (t) => {
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

  const cookieValue = `f89fa3a938a8bd4a4041b16cb2881905:${encodeURIComponent('/')}`;
  const mangledUrl =
    'http://localhost/api/auth/google/callback' +
    '?state=' +
    encodeURIComponent('f89fa3a938a8bd4a4041b16cb2881905?id_token=eyJhbGciOi.eyJpc3Mi.fFKg') +
    '&access_token=ya29.a0AdMD6Ejl5real-token' +
    '&raw%5Baccess_token%5D=ya29.a0AdMD6Ejl5real-token' +
    '&raw%5Bexpires_in%5D=3598' +
    '&raw%5Bscope%5D=' +
    encodeURIComponent('https://www.googleapis.com/auth/userinfo.email openid') +
    '&raw%5Btoken_type%5D=Bearer' +
    '&raw%5Bid_token%5D=eyJhbGciOi.eyJpc3Mi.fFKg';
  const req = makeRequest(mangledUrl, `valhalla_oauth_nonce=${encodeURIComponent(cookieValue)}`);
  const res = await GET(req);

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/');
  assert.equal(fetchMock.mock.callCount(), 1);
  const [calledUrl] = fetchMock.mock.calls[0].arguments as [string];
  assert.ok(calledUrl.includes(encodeURIComponent('ya29.a0AdMD6Ejl5real-token')));
});

test('callback: forged/mismatched state is rejected before any token exchange is attempted', async (t) => {
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
    'http://localhost/api/auth/google/callback?access_token=abc&state=forged-nonce',
    `valhalla_oauth_nonce=${encodeURIComponent(cookieValue)}`
  );
  const res = await GET(req);

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/entrar?error=oauth_failed');
  assert.equal(fetchMock.mock.callCount(), 0);

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert.ok(setCookies.some((c) => c.startsWith('valhalla_oauth_nonce=') && c.includes('Max-Age=0')));
  assert.ok(!setCookies.some((c) => c.startsWith('valhalla_access=')));
});

test('callback: missing state query param is rejected before any token exchange is attempted', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { GET } = await import('./route');

  const fetchMock = t.mock.method(globalThis, 'fetch', async () =>
    jsonResponse({ jwt: 'x', user: { id: 1, username: 'joe', email: 'joe@example.com', confirmed: true, blocked: false, role: {} } })
  );

  const cookieValue = `nonce123:${encodeURIComponent('/')}`;
  const req = makeRequest(
    'http://localhost/api/auth/google/callback?access_token=abc',
    `valhalla_oauth_nonce=${encodeURIComponent(cookieValue)}`
  );
  const res = await GET(req);

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/entrar?error=oauth_failed');
  assert.equal(fetchMock.mock.callCount(), 0);
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
    'http://localhost/api/auth/google/callback?access_token=abc&state=nonce123',
    `valhalla_oauth_nonce=${encodeURIComponent(cookieValue)}`
  );
  const res = await GET(req);

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/');
});

test('callback: googleCallback failure redirects to error page and clears nonce', async (t) => {
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { GET } = await import('./route');

  t.mock.method(globalThis, 'fetch', async () => jsonResponse({ error: 'bad token' }, 401));

  const cookieValue = `nonce123:${encodeURIComponent('/')}`;
  const req = makeRequest(
    'http://localhost/api/auth/google/callback?access_token=bad&state=nonce123',
    `valhalla_oauth_nonce=${encodeURIComponent(cookieValue)}`
  );
  const res = await GET(req);

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/entrar?error=oauth_failed');
});
