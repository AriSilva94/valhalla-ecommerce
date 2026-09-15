import test from 'node:test';
import assert from 'node:assert/strict';

import { checkRateLimit, type RateLimiterClient } from './redis';

test('checkRateLimit increments, expires the first request, and blocks over the limit using Redis TTL', async () => {
  const calls: string[] = [];
  const counts = [1, 2, 3];
  const client: RateLimiterClient = {
    incr: async (key) => {
      calls.push(`incr:${key}`);
      return counts.shift()!;
    },
    expire: async (key, seconds) => {
      calls.push(`expire:${key}:${seconds}`);
      return 1;
    },
    ttl: async (key) => {
      calls.push(`ttl:${key}`);
      return 42;
    },
  };

  assert.deepEqual(await checkRateLimit('login:127.0.0.1', 2, 300, client), { allowed: true });
  assert.deepEqual(await checkRateLimit('login:127.0.0.1', 2, 300, client), { allowed: true });
  assert.deepEqual(await checkRateLimit('login:127.0.0.1', 2, 300, client), {
    allowed: false,
    retryAfterSeconds: 42,
  });
  assert.deepEqual(calls, [
    'incr:login:127.0.0.1',
    'expire:login:127.0.0.1:300',
    'incr:login:127.0.0.1',
    'incr:login:127.0.0.1',
    'ttl:login:127.0.0.1',
  ]);
});

test('checkRateLimit fails open when Redis is not configured', async () => {
  assert.deepEqual(await checkRateLimit('login:127.0.0.1', 2, 300, null), { allowed: true });
});

test('checkRateLimit fails open when Redis returns an error', async (t) => {
  t.mock.method(console, 'error', () => undefined);
  const client: RateLimiterClient = {
    incr: async () => {
      throw new Error('Redis unavailable');
    },
    expire: async () => 1,
    ttl: async () => 0,
  };

  assert.deepEqual(await checkRateLimit('login:127.0.0.1', 2, 300, client), { allowed: true });
});
