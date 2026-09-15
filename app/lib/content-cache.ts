import { getRateLimitClient, type RedisContentCacheClient } from "./redis";

export type JsonCacheClient = RedisContentCacheClient;

export async function withJsonCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  client: JsonCacheClient | null = getRateLimitClient()
): Promise<T> {
  if (client) {
    try {
      const cached = await client.get(key);
      if (cached !== null) return JSON.parse(cached) as T;
    } catch {
      console.error("Redis content cache read failed");
    }
  }

  const fresh = await loader();

  if (client) {
    try {
      await client.setex(key, ttlSeconds, JSON.stringify(fresh));
    } catch {
      console.error("Redis content cache write failed");
    }
  }

  return fresh;
}
