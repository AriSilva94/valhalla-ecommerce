import test from 'node:test';
import assert from 'node:assert/strict';

function makeRequest(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { method: 'GET', headers });
}

test('google: sets nonce cookie and redirects to the Strapi public connect endpoint with a callback+state built from the request origin', async () => {
  process.env.STRAPI_PUBLIC_URL = 'https://api.example.com';
  process.env.AUTH_COOKIE_SECURE = 'true';
  const { GET } = await import('./route');

  const res = await GET(makeRequest('https://valhalla.example.com/api/auth/google'));
  assert.equal(res.status, 302);

  const location = res.headers.get('Location')!;
  assert.ok(location.startsWith('https://api.example.com/api/connect/google?callback='));

  const locationUrl = new URL(location);
  const callbackParam = locationUrl.searchParams.get('callback')!;
  const callbackUrl = new URL(callbackParam);
  assert.equal(callbackUrl.origin, 'https://valhalla.example.com');
  assert.equal(callbackUrl.pathname, '/api/auth/google/callback');
  const state = callbackUrl.searchParams.get('state');
  assert.ok(state && state.length > 0);

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert.equal(setCookies.length, 1);
  assert.ok(setCookies[0].startsWith('valhalla_oauth_nonce='));
  assert.ok(setCookies[0].includes('HttpOnly'));

  const cookieValue = decodeURIComponent(setCookies[0].split(';')[0].split('=')[1]);
  const [nonceFromCookie] = cookieValue.split(':');
  assert.equal(state, nonceFromCookie);
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

test('google: builds the callback from Host/X-Forwarded-Proto headers, not the dev server\'s own request.url (behind a tunnel, request.url keeps the local bind host)', async () => {
  process.env.STRAPI_PUBLIC_URL = 'https://api.example.com';
  process.env.AUTH_COOKIE_SECURE = 'true';
  const { GET } = await import('./route');

  const res = await GET(
    makeRequest('http://localhost:3000/api/auth/google', {
      host: 'attempt-twig-frying.ngrok-free.dev',
      'x-forwarded-proto': 'https',
    })
  );
  assert.equal(res.status, 302);

  const locationUrl = new URL(res.headers.get('Location')!);
  const callbackUrl = new URL(locationUrl.searchParams.get('callback')!);
  assert.equal(callbackUrl.origin, 'https://attempt-twig-frying.ngrok-free.dev');
});

test('google: missing STRAPI_PUBLIC_URL redirects to an error page instead of crashing', async () => {
  delete process.env.STRAPI_PUBLIC_URL;
  const { GET } = await import('./route');

  const res = await GET(makeRequest('http://localhost/api/auth/google'));
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/entrar?error=oauth_failed');
});
