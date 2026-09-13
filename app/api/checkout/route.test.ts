import test from "node:test";
import assert from "node:assert/strict";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function makeRequest(
  body: unknown,
  cookie?: string,
  options: { origin?: string | null; ip?: string } = {}
): Request {
  const headers = new Headers({ "Content-Type": "application/json" });
  const origin = options.origin === undefined ? "http://localhost" : options.origin;
  if (origin !== null) headers.set("Origin", origin);
  if (options.ip) headers.set("x-forwarded-for", options.ip);
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

test("403 INVALID_ORIGIN quando o Origin não confere com NEXT_PUBLIC_SITE_URL", async () => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost";
  const { POST } = await import("./route");

  const res = await POST(
    makeRequest(
      { items: [{ productSlug: "x", variantSku: "S", qty: 1 }] },
      "valhalla_access=tok",
      { origin: "https://evil.example.com" }
    )
  );
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error, "INVALID_ORIGIN");
});

test("401 quando não há cookie de sessão", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost";
  const { POST } = await import("./route");

  t.mock.method(globalThis, "fetch", async () => jsonResponse({}, 401));

  const res = await POST(
    makeRequest({ items: [{ productSlug: "x", variantSku: "S", qty: 1 }] }, undefined, { ip: "8.8.8.8" })
  );
  assert.equal(res.status, 401);
});

test("429 após exceder o limite de requisições na janela", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost";
  const { POST } = await import("./route");

  t.mock.method(globalThis, "fetch", async () => jsonResponse({}, 401));

  const ip = "5.5.5.5";
  let lastStatus = 0;
  for (let i = 0; i < 11; i += 1) {
    const res = await POST(
      makeRequest({ items: [{ productSlug: "x", variantSku: "S", qty: 1 }] }, undefined, { ip })
    );
    lastStatus = res.status;
  }
  assert.equal(lastStatus, 429);
});

test("o corpo enviado ao Strapi /api/orders nunca inclui unitPrice em nenhum item", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost";
  const { POST } = await import("./route");

  let capturedBody: string | undefined;
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    if (url.includes("/api/users/me")) {
      return jsonResponse({ id: 1, username: "joe", email: "j@x.com", confirmed: true, blocked: false, role: {} });
    }
    if (url.includes("/api/orders")) {
      capturedBody = init?.body as string;
      return jsonResponse({ ok: true, data: { id: 1, status: "pending" } }, 201);
    }
    return jsonResponse({});
  });

  const res = await POST(
    makeRequest(
      { items: [{ productSlug: "x", variantSku: "S", qty: 1, unitPrice: 999 }] },
      "valhalla_access=tok",
      { ip: "6.6.6.6" }
    )
  );
  assert.equal(res.status, 201);
  assert.ok(capturedBody, "expected the Strapi call body to be captured");
  const parsed = JSON.parse(capturedBody!);
  for (const item of parsed.items) {
    assert.ok(!("unitPrice" in item), "item sent to Strapi must not include unitPrice");
  }
});
