import test from "node:test";
import assert from "node:assert/strict";
import { notFound, redirect } from "next/navigation";
import { normalizeStrapiUrl, withCacheFallback, withCacheOrThrow } from "./strapi";

// Regression coverage for the unstable_rethrow bug that broke the production
// build: a Next.js internal control-flow error (notFound()/redirect()) must
// escape withCacheFallback/withCacheOrThrow untouched, never be swallowed and
// replaced with a cached/default value. We use the real `notFound`/`redirect`
// from next/navigation so the thrown errors carry the exact `digest` shape
// (`NEXT_HTTP_ERROR_FALLBACK;404`, `NEXT_REDIRECT;...`) that the real
// `unstable_rethrow` implementation recognizes, rather than a hand-rolled
// approximation that might not exercise its actual logic.
function throwNotFound(): never {
  notFound();
}

function throwRedirect(): never {
  redirect("/somewhere");
}

test("withCacheFallback: a notFound() control-flow error escapes untouched, not swallowed as a fallback", async () => {
  await assert.rejects(
    () => withCacheFallback("wcf-notfound-key", async () => throwNotFound(), "default"),
    (err: unknown) => {
      assert.match((err as Error & { digest?: string }).digest ?? "", /^NEXT_HTTP_ERROR_FALLBACK;404/);
      return true;
    }
  );
});

test("withCacheFallback: a redirect() control-flow error escapes untouched, not swallowed as a fallback", async () => {
  await assert.rejects(
    () => withCacheFallback("wcf-redirect-key", async () => throwRedirect(), "default"),
    (err: unknown) => {
      assert.match((err as Error & { digest?: string }).digest ?? "", /^NEXT_REDIRECT;/);
      return true;
    }
  );
});

test("withCacheOrThrow: a notFound() control-flow error escapes untouched, not swallowed as cache/rethrow", async () => {
  await assert.rejects(
    () => withCacheOrThrow("wcot-notfound-key", async () => throwNotFound()),
    (err: unknown) => {
      assert.match((err as Error & { digest?: string }).digest ?? "", /^NEXT_HTTP_ERROR_FALLBACK;404/);
      return true;
    }
  );
});

test("withCacheOrThrow: a redirect() control-flow error escapes untouched, not swallowed as cache/rethrow", async () => {
  await assert.rejects(
    () => withCacheOrThrow("wcot-redirect-key", async () => throwRedirect()),
    (err: unknown) => {
      assert.match((err as Error & { digest?: string }).digest ?? "", /^NEXT_REDIRECT;/);
      return true;
    }
  );
});

test("withCacheOrThrow: a notFound() error after a prior successful cache is still rethrown, not served stale", async () => {
  const first = await withCacheOrThrow("wcot-notfound-after-cache-key", async () => "fresh");
  assert.equal(first, "fresh");

  await assert.rejects(
    () => withCacheOrThrow("wcot-notfound-after-cache-key", async () => throwNotFound()),
    (err: unknown) => {
      assert.match((err as Error & { digest?: string }).digest ?? "", /^NEXT_HTTP_ERROR_FALLBACK;404/);
      return true;
    }
  );
});

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

// Every request path is built as `${STRAPI_URL}${path}` and each path already
// starts with "/". The deploy env files carry the value with a trailing slash
// ("https://api.valhallatecnologia.com.br/"), which yields "//api/products".
// Strapi tolerates it today, but a proxy that does not would 404 the whole
// catalogue into the empty fallback.
test("normalizeStrapiUrl: strips trailing slashes so paths never double up", () => {
  assert.equal(normalizeStrapiUrl("https://api.example.com/"), "https://api.example.com");
  assert.equal(normalizeStrapiUrl("https://api.example.com///"), "https://api.example.com");
  assert.equal(normalizeStrapiUrl("https://api.example.com"), "https://api.example.com");
});

test("normalizeStrapiUrl: trims surrounding whitespace", () => {
  assert.equal(normalizeStrapiUrl("  https://api.example.com/  "), "https://api.example.com");
});

test("normalizeStrapiUrl: falls back to localhost when unset or blank", () => {
  assert.equal(normalizeStrapiUrl(undefined), "http://localhost:1337");
  assert.equal(normalizeStrapiUrl(""), "http://localhost:1337");
  assert.equal(normalizeStrapiUrl("   "), "http://localhost:1337");
});
