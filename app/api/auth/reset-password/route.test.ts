import test from 'node:test';
import assert from 'node:assert/strict';

const SITE_URL = 'https://valhalla.example.com';

function makeRequest(ip: string, body: unknown, origin: string | null = SITE_URL): Request {
  const headers = new Headers({ 'Content-Type': 'application/json', 'x-forwarded-for': ip });
  if (origin) headers.set('Origin', origin);
  return new Request('http://localhost/api/auth/reset-password', { method: 'POST', headers, body: JSON.stringify(body) });
}

test('reset-password: 403 INVALID_ORIGIN on mismatched origin', async () => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
  const { POST } = await import('./route');
  const req = makeRequest('22.1.1.1', { code: 'c', password: 'password123', passwordConfirmation: 'password123' }, 'https://evil.example.com');
  const res = await POST(req);
  assert.equal(res.status, 403);
});

test('reset-password: 400 VALIDATION_ERROR when passwords do not match', async () => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
  const { POST } = await import('./route');
  const req = makeRequest('22.1.1.2', { code: 'c', password: 'password123', passwordConfirmation: 'other12345' });
  const res = await POST(req);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, 'VALIDATION_ERROR');
});

test('reset-password: success returns neutral ok with no tokens', async (t) => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { POST } = await import('./route');

  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({}), { status: 200 }));

  const req = makeRequest('22.1.1.3', { code: 'c', password: 'password123', passwordConfirmation: 'password123' });
  const res = await POST(req);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, { ok: true, data: null });
});

test('reset-password: 429 after the configured limit is exceeded', async () => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
  process.env.STRAPI_INTERNAL_URL = 'http://strapi.internal';
  const { POST } = await import('./route');

  const ip = '22.1.1.4';
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({}), { status: 200 })) as typeof fetch;
  try {
    let lastStatus = 0;
    for (let i = 0; i < 11; i += 1) {
      const res = await POST(makeRequest(ip, { code: 'c', password: 'password123', passwordConfirmation: 'password123' }));
      lastStatus = res.status;
    }
    assert.equal(lastStatus, 429);
    const retryResponse = await POST(makeRequest(ip, { code: 'reset-code', password: 'password123', passwordConfirmation: 'password123' }));
    assert.ok(retryResponse.headers.has('Retry-After'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
