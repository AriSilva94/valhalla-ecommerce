import test from 'node:test';
import assert from 'node:assert/strict';

const SITE_URL = 'https://valhalla.example.com';

function makeRequest(ip: string, body: unknown, origin: string | null = SITE_URL): Request {
  const headers = new Headers({ 'Content-Type': 'application/json', 'x-forwarded-for': ip });
  if (origin) headers.set('Origin', origin);
  return new Request('http://localhost/api/auth/resend-confirmation', { method: 'POST', headers, body: JSON.stringify(body) });
}

test('resend-confirmation: 403 INVALID_ORIGIN on mismatched origin', async () => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
  const { POST } = await import('./route');
  const req = makeRequest('21.1.1.1', { email: 'joe@example.com' }, 'https://evil.example.com');
  const res = await POST(req);
  assert.equal(res.status, 403);
});

test('resend-confirmation: neutral success regardless of Strapi outcome', async (t) => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { POST } = await import('./route');

  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: 'already confirmed' }), { status: 400 }));

  const req = makeRequest('21.1.1.2', { email: 'joe@example.com' });
  const res = await POST(req);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, { ok: true, data: null });
});

test('resend-confirmation: 429 after the configured limit is exceeded', async () => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { POST } = await import('./route');

  const ip = '21.1.1.3';
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({}), { status: 200 })) as typeof fetch;
  try {
    let lastStatus = 0;
    for (let i = 0; i < 6; i += 1) {
      const res = await POST(makeRequest(ip, { email: 'joe@example.com' }));
      lastStatus = res.status;
    }
    assert.equal(lastStatus, 429);
    const retryResponse = await POST(makeRequest(ip, { email: 'joe@example.com' }));
    assert.ok(retryResponse.headers.has('Retry-After'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
