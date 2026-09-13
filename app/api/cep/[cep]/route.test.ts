import test from "node:test";
import assert from "node:assert/strict";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
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
