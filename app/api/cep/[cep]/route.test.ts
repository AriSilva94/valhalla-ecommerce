import test from "node:test";
import assert from "node:assert/strict";
import type { JsonCacheClient } from "../../../lib/content-cache";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function createCacheClient(): JsonCacheClient & { writes: Array<[string, number, string]> } {
  const writes: Array<[string, number, string]> = [];
  return {
    get: async () => null,
    setex: async (key, ttlSeconds, value) => {
      writes.push([key, ttlSeconds, value]);
      return "OK";
    },
    writes,
  };
}

function createMemoryCacheClient(): JsonCacheClient & { writes: Array<[string, number, string]> } {
  const values = new Map<string, string>();
  const writes: Array<[string, number, string]> = [];
  return {
    get: async (key) => values.get(key) ?? null,
    setex: async (key, ttlSeconds, value) => {
      writes.push([key, ttlSeconds, value]);
      values.set(key, value);
      return "OK";
    },
    writes,
  };
}

test("GET: 400 quando o CEP não tem 8 dígitos", async () => {
  const { GET } = await import("./route");
  const res = await GET(new Request("http://localhost/api/cep/123"), {
    params: Promise.resolve({ cep: "123" }),
  });
  assert.equal(res.status, 400);
});

test("GET: retorna os dados normalizados do ViaCEP", async (t) => {
  const { GET } = await import("./route");

  t.mock.method(globalThis, "fetch", async (url: string) => {
    assert.ok(url.includes("viacep.com.br/ws/01310100/json"));
    return jsonResponse({ logradouro: "Avenida Paulista", bairro: "Bela Vista", localidade: "São Paulo", uf: "SP" });
  });

  const res = await GET(new Request("http://localhost/api/cep/01310-100"), {
    params: Promise.resolve({ cep: "01310-100" }),
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.deepEqual(body.data, {
    addressLine: "Avenida Paulista",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
  });
});

test("lookupCep caches only a valid ViaCEP response for one week", async () => {
  const { lookupCep } = await import("./route");
  const cache = createCacheClient();

  const res = await lookupCep("01310-100", {
    cache,
    fetcher: async () => jsonResponse({ logradouro: "Avenida Paulista", bairro: "Bela Vista", localidade: "São Paulo", uf: "SP" }),
  });

  assert.equal(res.status, 200);
  assert.deepEqual(cache.writes, [[
    "cep:01310100",
    604800,
    JSON.stringify({ addressLine: "Avenida Paulista", neighborhood: "Bela Vista", city: "São Paulo", state: "SP" }),
  ]]);
});

test("lookupCep rejects non-200 and malformed ViaCEP payloads without caching them", async () => {
  const { lookupCep } = await import("./route");
  const cache = createCacheClient();

  assert.equal(
    (await lookupCep("01310100", {
      cache,
      fetcher: async () => jsonResponse({ logradouro: "Avenida Paulista", bairro: "Bela Vista", localidade: "São Paulo", uf: "SP" }, 201),
    })).status,
    502
  );
  assert.equal((await lookupCep("01310100", { cache, fetcher: async () => jsonResponse({}) })).status, 502);
  assert.deepEqual(cache.writes, []);
});

test("lookupCep serves the second identical valid CEP request from injected Redis", async () => {
  const { lookupCep } = await import("./route");
  const cache = createMemoryCacheClient();
  let viaCepFetches = 0;
  const fetcher: typeof fetch = async () => {
    viaCepFetches += 1;
    return jsonResponse({ logradouro: "Avenida Paulista", bairro: "Bela Vista", localidade: "São Paulo", uf: "SP" });
  };

  const first = await lookupCep("01310-100", { cache, fetcher });
  const second = await lookupCep("01310-100", { cache, fetcher });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(viaCepFetches, 1);
  assert.equal(cache.writes.length, 1);
  assert.deepEqual(await second.json(), await first.json());
});

test("GET: 404 quando o ViaCEP não encontra o CEP", async (t) => {
  const { GET } = await import("./route");

  t.mock.method(globalThis, "fetch", async () => jsonResponse({ erro: true }));

  const res = await GET(new Request("http://localhost/api/cep/00000000"), {
    params: Promise.resolve({ cep: "00000000" }),
  });
  assert.equal(res.status, 404);
});

test("GET: 502 quando o ViaCEP está fora do ar", async (t) => {
  const { GET } = await import("./route");

  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("network down");
  });

  const res = await GET(new Request("http://localhost/api/cep/01310100"), {
    params: Promise.resolve({ cep: "01310100" }),
  });
  assert.equal(res.status, 502);
});

test("lookupCep does not cache validation, not-found, or upstream failures", async () => {
  const { lookupCep } = await import("./route");
  const cache = createCacheClient();

  assert.equal((await lookupCep("123", { cache, fetcher: async () => jsonResponse({}) })).status, 400);
  assert.equal((await lookupCep("00000000", { cache, fetcher: async () => jsonResponse({ erro: true }) })).status, 404);
  assert.equal((await lookupCep("01310100", { cache, fetcher: async () => jsonResponse(null, 500) })).status, 502);
  assert.deepEqual(cache.writes, []);
});
