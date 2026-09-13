import test from "node:test";
import assert from "node:assert/strict";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function makeRequest(body: unknown, cookie?: string): Request {
  const headers = new Headers({ "Content-Type": "application/json", Origin: "http://localhost" });
  if (cookie) headers.set("cookie", cookie);
  return new Request("http://localhost/api/checkout", { method: "POST", headers, body: JSON.stringify(body) });
}

test("400 EMPTY_CART com items vazio", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost";
  const { POST } = await import("./route");

  t.mock.method(globalThis, "fetch", async (url: string) =>
    url.includes("/api/users/me")
      ? jsonResponse({ id: 1, username: "joe", email: "j@x.com", confirmed: true, blocked: false, role: {} })
      : jsonResponse({})
  );

  const res = await POST(makeRequest({ items: [] }, "valhalla_access=tok"));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, "EMPTY_CART");
});

test("201 com pedido criado quando o Strapi confirma", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost";
  const { POST } = await import("./route");

  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("/api/users/me")) {
      return jsonResponse({ id: 1, username: "joe", email: "j@x.com", confirmed: true, blocked: false, role: {} });
    }
    if (url.includes("/api/orders")) {
      return jsonResponse({ ok: true, data: { id: 1, status: "pending" } }, 201);
    }
    return jsonResponse({});
  });

  const res = await POST(
    makeRequest({ items: [{ productSlug: "x", variantSku: "S", qty: 1 }] }, "valhalla_access=tok")
  );
  assert.equal(res.status, 201);
});
