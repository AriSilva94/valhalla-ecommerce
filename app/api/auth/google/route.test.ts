import test from 'node:test';
import assert from 'node:assert/strict';

function makeRequest(url: string): Request {
  return new Request(url, { method: 'GET' });
}

test('google: sets nonce cookie and redirects to the Strapi public connect endpoint with a callback URL carrying the nonce as a path segment', async () => {
  process.env.STRAPI_PUBLIC_URL = 'https://api.example.com';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://valhalla.example.com';
  process.env.AUTH_COOKIE_SECURE = 'true';
  const { GET } = await import('./route');

  const res = await GET(makeRequest('http://localhost/api/auth/google'));
  assert.equal(res.status, 302);

  const location = res.headers.get('Location')!;
  assert.ok(location.startsWith('https://api.example.com/api/connect/google?callback='));

  const locationUrl = new URL(location);
  const callbackParam = locationUrl.searchParams.get('callback')!;
  const callbackUrl = new URL(callbackParam);
  assert.equal(callbackUrl.origin, 'https://valhalla.example.com');
  // The nonce is a path segment, not a `?state=` query param — see the
  // route's comment for why: grant appends its own querystring onto
  // `callback` by blind concatenation, so a `?`-based nonce here would get
  // corrupted by grant's own `?` on the round trip.
  assert.equal(callbackUrl.search, '');
  const pathParts = callbackUrl.pathname.split('/');
  const nonceFromUrl = pathParts.pop();
  assert.equal(pathParts.join('/'), '/api/auth/google/callback');
  assert.ok(nonceFromUrl && nonceFromUrl.length > 0);

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert.equal(setCookies.length, 1);
  assert.ok(setCookies[0].startsWith('valhalla_oauth_nonce='));
  assert.ok(setCookies[0].includes('HttpOnly'));

  // The nonce embedded in the callback path must match the nonce stored
  // in the cookie, so the callback route can verify it later.
  const cookieValue = decodeURIComponent(setCookies[0].split(';')[0].split('=')[1]);
  const [nonceFromCookie] = cookieValue.split(':');
  assert.equal(nonceFromUrl, nonceFromCookie);
});

test('google: invalid returnTo falls back to "/" inside the nonce cookie value', async () => {
  process.env.STRAPI_PUBLIC_URL = 'https://api.example.com';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://valhalla.example.com';
  process.env.AUTH_COOKIE_SECURE = 'false';
  const { GET } = await import('./route');

  const res = await GET(
    makeRequest('http://localhost/api/auth/google?returnTo=//evil.example.com')
  );
  assert.equal(res.status, 302);

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const nonceCookie = setCookies.find((c) => c.startsWith('valhalla_oauth_nonce='));
  assert.ok(nonceCookie);
  const value = decodeURIComponent(nonceCookie!.split(';')[0].split('=')[1]);
  assert.ok(value.endsWith(`:${encodeURIComponent('/')}`));
});

test('google: missing STRAPI_PUBLIC_URL redirects to an error page instead of crashing', async () => {
  delete process.env.STRAPI_PUBLIC_URL;
  const { GET } = await import('./route');

  const res = await GET(makeRequest('http://localhost/api/auth/google'));
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/entrar?error=oauth_failed');
});
