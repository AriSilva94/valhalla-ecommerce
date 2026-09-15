import { Redis, type RedisOptions } from 'ioredis';

export type RateLimiterClient = {
  eval(script: string, keyCount: number, key: string, windowSeconds: string): Promise<unknown>;
};

export type RedisRateLimitClient = RateLimiterClient & {
  status: string;
  on(event: 'error', listener: (error: Error) => void): unknown;
};

export type RedisClientFactory = (url: string, options: RedisOptions) => RedisRateLimitClient;

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  local expireResult = redis.pcall('EXPIRE', KEYS[1], ARGV[1])
  if (type(expireResult) == 'table' and expireResult.err) or expireResult ~= 1 then
    redis.call('DEL', KEYS[1])
    return { 0, 0 }
  end
end

local ttl = redis.call('TTL', KEYS[1])
if ttl <= 0 then
  redis.call('DEL', KEYS[1])
  return { 0, 0 }
end

return { count, ttl }
`;

let sharedClient: RedisRateLimitClient | null | undefined;

function createRedisClient(url: string, options: RedisOptions): RedisRateLimitClient {
  return new Redis(url, options);
}

export function getRateLimitClient(clientFactory: RedisClientFactory = createRedisClient): RedisRateLimitClient | null {
  if (sharedClient?.status === 'end') sharedClient = undefined;
  if (sharedClient !== undefined) return sharedClient;

  const url = process.env.REDIS_URL;
  if (!url) {
    sharedClient = null;
    return sharedClient;
  }

  try {
    sharedClient = clientFactory(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    sharedClient.on('error', () => {
      console.error('Redis rate limit connection failed');
    });
  } catch {
    console.error('Redis rate limit client could not be created');
    sharedClient = null;
  }

  return sharedClient;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  client: RateLimiterClient | null = getRateLimitClient()
): Promise<RateLimitResult> {
  if (!client) return { allowed: true };

  try {
    const response = await client.eval(RATE_LIMIT_SCRIPT, 1, key, String(windowSeconds));
    if (!Array.isArray(response) || response.length !== 2) throw new Error('Unexpected Redis rate limit response');

    const [count, ttl] = response.map(Number);
    if (!Number.isFinite(count) || !Number.isFinite(ttl)) throw new Error('Invalid Redis rate limit response');
    if (count > limit) return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds };

    return { allowed: true };
  } catch {
    console.error('Redis rate limit check failed; allowing request');
    return { allowed: true };
  }
}
