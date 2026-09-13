import test from "node:test";
import assert from "node:assert/strict";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

test("POST: 404 com reference em formato inválido", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { POST } = await import("./route");

  t.mock.method(globalThis, "fetch", async (url: string) =>
    url.includes("/api/users/me")
      ? jsonResponse({ id: 1, username: "joe", email: "j@x.com", confirmed: true, blocked: false, role: {} })
      : jsonResponse({})
  );

  const headers = new Headers({ cookie: "valhalla_access=tok" });
  const res = await POST(new Request("http://localhost/api/orders/abc/simulate-payment", { headers, method: "POST" }), {
    params: Promise.resolve({ id: "abc" }),
  });
  assert.equal(res.status, 404);
});

test("POST: repassa o resultado de sucesso do Strapi", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { POST } = await import("./route");

  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("/api/users/me")) {
      return jsonResponse({ id: 1, username: "joe", email: "j@x.com", confirmed: true, blocked: false, role: {} });
    }
    if (url.includes("/simulate-payment")) {
      return jsonResponse({ ok: true });
    }
    return jsonResponse({});
  });

  const headers = new Headers({ cookie: "valhalla_access=tok" });
  const res = await POST(new Request("http://localhost/api/orders/abc123def4/simulate-payment", { headers, method: "POST" }), {
    params: Promise.resolve({ id: "abc123def4" }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
});

test("POST: repassa erro PAYMENT_NOT_READY do Strapi", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { POST } = await import("./route");

  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("/api/users/me")) {
      return jsonResponse({ id: 1, username: "joe", email: "j@x.com", confirmed: true, blocked: false, role: {} });
    }
    if (url.includes("/simulate-payment")) {
      return jsonResponse({ ok: false, error: "PAYMENT_NOT_READY" }, 409);
    }
    return jsonResponse({});
  });

  const headers = new Headers({ cookie: "valhalla_access=tok" });
  const res = await POST(new Request("http://localhost/api/orders/abc123def4/simulate-payment", { headers, method: "POST" }), {
    params: Promise.resolve({ id: "abc123def4" }),
  });
  const body = await res.json();
  assert.equal(res.status, 409);
  assert.equal(body.error, "PAYMENT_NOT_READY");
});
