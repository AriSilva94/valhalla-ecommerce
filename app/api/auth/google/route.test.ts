import test from 'node:test';
import assert from 'node:assert/strict';

function makeRequest(url: string): Request {
  return new Request(url, { method: 'GET' });
}

test('google: sets nonce cookie and redirects to the Strapi public connect endpoint', async () => {
  process.env.STRAPI_PUBLIC_URL = 'https://api.example.com';
  process.env.AUTH_COOKIE_SECURE = 'true';
  const { GET } = await import('./route');

  const res = await GET(makeRequest('http://localhost/api/auth/google'));
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), 'https://api.example.com/api/connect/google');

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert.equal(setCookies.length, 1);
  assert.ok(setCookies[0].startsWith('valhalla_oauth_nonce='));
  assert.ok(setCookies[0].includes('HttpOnly'));
});

test('google: invalid returnTo falls back to "/" inside the nonce cookie value', async () => {
  process.env.STRAPI_PUBLIC_URL = 'https://api.example.com';
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
