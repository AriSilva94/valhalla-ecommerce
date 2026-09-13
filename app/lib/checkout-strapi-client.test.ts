import test from "node:test";
import assert from "node:assert/strict";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

test("getProfile: retorna data em caso de sucesso", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { getProfile } = await import("./checkout-strapi-client");

  t.mock.method(globalThis, "fetch", async () => jsonResponse({ ok: true, data: null }));

  const result = await getProfile("token-abc");
  assert.deepEqual(result, { ok: true, data: null });
});

test("getProfile: mapeia 401 para UNAUTHENTICATED", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { getProfile } = await import("./checkout-strapi-client");

  t.mock.method(globalThis, "fetch", async () => jsonResponse({}, 401));

  const result = await getProfile("token-abc");
  assert.deepEqual(result, { ok: false, error: "UNAUTHENTICATED", status: 401 });
});

test("updateProfile: envia PUT com o corpo do perfil", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { updateProfile } = await import("./checkout-strapi-client");

  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    jsonResponse({ ok: true, data: { cpfCnpj: "11144477735" } })
  );

  const profile = {
    cpfCnpj: "11144477735", phone: "", addressLine: "Rua X", addressNumber: "10",
    addressComplement: "", neighborhood: "Centro", city: "São Paulo", state: "SP", postalCode: "01310100",
  };
  const result = await updateProfile("token-abc", profile);

  assert.equal(result.ok, true);
  const [, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit];
  assert.equal(init.method, "PUT");
  assert.equal(JSON.parse(init.body as string).cpfCnpj, "11144477735");
});

test("createOrder: envia POST e retorna o pedido criado", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { createOrder } = await import("./checkout-strapi-client");

  t.mock.method(globalThis, "fetch", async () =>
    jsonResponse({ ok: true, data: { id: 1, status: "pending" } }, 201)
  );

  const result = await createOrder("token-abc", [{ productSlug: "x", variantSku: "S", qty: 1 }]);
  assert.deepEqual(result, { ok: true, data: { id: 1, status: "pending" } });
});

test("listOrders: retorna a lista de pedidos", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { listOrders } = await import("./checkout-strapi-client");

  t.mock.method(globalThis, "fetch", async () => jsonResponse({ ok: true, data: [] }));

  const result = await listOrders("token-abc");
  assert.deepEqual(result, { ok: true, data: [] });
});

test("getOrder: retorna NOT_FOUND para 404", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { getOrder } = await import("./checkout-strapi-client");

  t.mock.method(globalThis, "fetch", async () => jsonResponse({}, 404));

  const result = await getOrder("token-abc", "abc123def4");
  assert.deepEqual(result, { ok: false, error: "NOT_FOUND", status: 404 });
});

test("simulatePayment: envia POST e retorna ok em sucesso", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { simulatePayment } = await import("./checkout-strapi-client");

  const fetchMock = t.mock.method(globalThis, "fetch", async () => jsonResponse({ ok: true }));

  const result = await simulatePayment("token-abc", "abc123def4");
  assert.equal(result.ok, true);
  const [url, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit];
  assert.equal(url, "http://strapi.internal/api/orders/abc123def4/simulate-payment");
  assert.equal(init.method, "POST");
});

test("simulatePayment: propaga erro PAYMENT_NOT_READY", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { simulatePayment } = await import("./checkout-strapi-client");

  t.mock.method(globalThis, "fetch", async () => jsonResponse({ ok: false, error: "PAYMENT_NOT_READY" }, 409));

  const result = await simulatePayment("token-abc", "abc123def4");
  assert.deepEqual(result, { ok: false, error: "PAYMENT_NOT_READY", status: 409 });
});
