import test from "node:test";
import assert from "node:assert/strict";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function makeRequest(cookie?: string, origin = "http://localhost"): Request {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  headers.set("Origin", origin);
  return new Request("http://localhost/api/orders/abc123def4/simulate-payment", { method: "POST", headers });
}

test("POST: 403 INVALID_ORIGIN quando o Origin não confere", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost";
  const { POST } = await import("./route");

  const res = await POST(makeRequest("valhalla_access=tok", "http://evil.example"), {
    params: Promise.resolve({ id: "abc123def4" }),
  });
  assert.equal(res.status, 403);
});

test("POST: 401 sem sessão", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost";
  const { POST } = await import("./route");

  t.mock.method(globalThis, "fetch", async () => jsonResponse({}, 401));

  const res = await POST(makeRequest(), { params: Promise.resolve({ id: "abc123def4" }) });
  assert.equal(res.status, 401);
});

test("POST: 404 com reference em formato inválido", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost";
  const { POST } = await import("./route");

  t.mock.method(globalThis, "fetch", async (url: string) =>
    url.includes("/api/users/me")
      ? jsonResponse({ id: 1, username: "joe", email: "j@x.com", confirmed: true, blocked: false, role: {} })
      : jsonResponse({})
  );

  const res = await POST(makeRequest("valhalla_access=tok"), { params: Promise.resolve({ id: "abc" }) });
  assert.equal(res.status, 404);
});

test("POST: encaminha para o Strapi e retorna 200 ok em sucesso", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost";
  const { POST } = await import("./route");

  const fetchMock = t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("/api/users/me")) {
      return jsonResponse({ id: 1, username: "joe", email: "j@x.com", confirmed: true, blocked: false, role: {} });
    }
    if (url.includes("/simulate-payment")) {
      return jsonResponse({ ok: true });
    }
    return jsonResponse({});
  });

  const res = await POST(makeRequest("valhalla_access=tok"), { params: Promise.resolve({ id: "abc123def4" }) });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  const calledUrls = fetchMock.mock.calls.map((c) => c.arguments[0] as string);
  assert.ok(calledUrls.some((u) => u.includes("/api/orders/abc123def4/simulate-payment")));
});

test("POST: propaga erro do Strapi (ex: 409 ORDER_NOT_PENDING)", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost";
  const { POST } = await import("./route");

  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("/api/users/me")) {
      return jsonResponse({ id: 1, username: "joe", email: "j@x.com", confirmed: true, blocked: false, role: {} });
    }
    return jsonResponse({ ok: false, error: "ORDER_NOT_PENDING" }, 409);
  });

  const res = await POST(makeRequest("valhalla_access=tok"), { params: Promise.resolve({ id: "abc123def4" }) });
  assert.equal(res.status, 409);
});
