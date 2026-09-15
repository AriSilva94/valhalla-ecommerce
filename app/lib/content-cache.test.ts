import assert from "node:assert/strict";
import test from "node:test";

import { withJsonCache, type JsonCacheClient } from "./content-cache";

function createClient(overrides: Partial<JsonCacheClient> = {}): JsonCacheClient & { writes: Array<[string, number, string]> } {
  const writes: Array<[string, number, string]> = [];
  return {
    get: async () => null,
    setex: async (key, ttlSeconds, value) => {
      writes.push([key, ttlSeconds, value]);
      return "OK";
    },
    writes,
    ...overrides,
  };
}

test("withJsonCache returns a parsed Redis hit without calling the loader", async () => {
  const client = createClient({ get: async () => '{"name":"cached"}' });
  let loads = 0;

  const result = await withJsonCache("content:example", 60, async () => {
    loads += 1;
    return { name: "fresh" };
  }, client);

  assert.deepEqual(result, { name: "cached" });
  assert.equal(loads, 0);
  assert.deepEqual(client.writes, []);
});

test("withJsonCache loads a miss and writes the JSON with its TTL", async () => {
  const client = createClient();

  const result = await withJsonCache("content:example", 60, async () => ({ name: "fresh" }), client);

  assert.deepEqual(result, { name: "fresh" });
  assert.deepEqual(client.writes, [["content:example", 60, '{"name":"fresh"}']]);
});

test("withJsonCache falls through to its loader after a Redis read error or invalid JSON", async () => {
  const readErrorClient = createClient({ get: async () => { throw new Error("Redis unavailable"); } });
  const invalidJsonClient = createClient({ get: async () => "not-json" });

  assert.deepEqual(await withJsonCache("content:read-error", 60, async () => ({ fresh: true }), readErrorClient), { fresh: true });
  assert.deepEqual(await withJsonCache("content:invalid-json", 60, async () => ({ fresh: true }), invalidJsonClient), { fresh: true });
});

test("withJsonCache returns the fresh value when Redis cannot write it", async () => {
  const client = createClient({ setex: async () => { throw new Error("Redis unavailable"); } });

  assert.deepEqual(await withJsonCache("content:write-error", 60, async () => ({ fresh: true }), client), { fresh: true });
});

test("withJsonCache does not cache a loader exception", async () => {
  const client = createClient();

  await assert.rejects(
    () => withJsonCache("content:failure", 60, async () => { throw new Error("upstream failed"); }, client),
    /upstream failed/
  );
  assert.deepEqual(client.writes, []);
});

test("withJsonCache uses the loader when no Redis client is configured", async () => {
  assert.deepEqual(await withJsonCache("content:none", 60, async () => ({ fresh: true }), null), { fresh: true });
});
