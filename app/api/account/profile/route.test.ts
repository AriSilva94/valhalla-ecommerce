import test from "node:test";
import assert from "node:assert/strict";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function makeRequest(url: string, init: RequestInit = {}, cookie?: string): Request {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("cookie", cookie);
  return new Request(url, { ...init, headers });
}

test("GET: 401 sem sessão", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { GET } = await import("./route");

  t.mock.method(globalThis, "fetch", async () => jsonResponse({}, 401));

  const res = await GET(makeRequest("http://localhost/api/account/profile"));
  assert.equal(res.status, 401);
});

test("GET: retorna o perfil com sessão válida", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { GET } = await import("./route");

  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("/api/users/me")) {
      return jsonResponse({ id: 1, username: "joe", email: "joe@example.com", confirmed: true, blocked: false, role: {} });
    }
    return jsonResponse({ ok: true, data: null });
  });

  const res = await GET(makeRequest("http://localhost/api/account/profile", {}, "valhalla_access=tok"));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, { ok: true, data: null });
});

test("PUT: 400 VALIDATION_ERROR com CPF inválido", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { PUT } = await import("./route");

  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("/api/users/me")) {
      return jsonResponse({ id: 1, username: "joe", email: "joe@example.com", confirmed: true, blocked: false, role: {} });
    }
    return jsonResponse({});
  });

  const res = await PUT(
    makeRequest(
      "http://localhost/api/account/profile",
      { method: "PUT", body: JSON.stringify({ cpfCnpj: "000", postalCode: "01310100", state: "SP", addressLine: "Rua X", addressNumber: "10", neighborhood: "Centro", city: "SP" }) },
      "valhalla_access=tok"
    )
  );
  assert.equal(res.status, 400);
});
