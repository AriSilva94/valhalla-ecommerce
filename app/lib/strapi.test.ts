import test from "node:test";
import assert from "node:assert/strict";
import { withCacheFallback, withCacheOrThrow } from "./strapi";

test("withCacheFallback: success returns the value and caches it", async () => {
  const result = await withCacheFallback("wcf-key-1", async () => "fresh", "default");
  assert.equal(result, "fresh");
});

test("withCacheFallback: failure with no prior cache returns the fallback", async () => {
  const result = await withCacheFallback(
    "wcf-key-2",
    async () => {
      throw new Error("strapi down");
    },
    "default"
  );
  assert.equal(result, "default");
});

test("withCacheFallback: failure after a prior success returns the stale cached value", async () => {
  const first = await withCacheFallback("wcf-key-3", async () => "fresh", "default");
  assert.equal(first, "fresh");

  const second = await withCacheFallback(
    "wcf-key-3",
    async () => {
      throw new Error("strapi down");
    },
    "default"
  );
  assert.equal(second, "fresh");
});

test("withCacheOrThrow: success returns the value and caches it", async () => {
  const result = await withCacheOrThrow("wcot-key-1", async () => "fresh");
  assert.equal(result, "fresh");
});

test("withCacheOrThrow: failure with no prior cache rethrows the original error", async () => {
  await assert.rejects(
    () =>
      withCacheOrThrow("wcot-key-2", async () => {
        throw new Error("strapi down");
      }),
    /strapi down/
  );
});

test("withCacheOrThrow: failure after a prior success returns the stale cached value", async () => {
  const first = await withCacheOrThrow("wcot-key-3", async () => "fresh");
  assert.equal(first, "fresh");

  const second = await withCacheOrThrow("wcot-key-3", async () => {
    throw new Error("strapi down");
  });
  assert.equal(second, "fresh");
});
