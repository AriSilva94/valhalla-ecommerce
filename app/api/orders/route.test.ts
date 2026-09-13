import test from "node:test";
import assert from "node:assert/strict";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

test("GET: retorna a lista de pedidos com sessão válida", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { GET } = await import("./route");

  t.mock.method(globalThis, "fetch", async (url: string) =>
    url.includes("/api/users/me")
      ? jsonResponse({ id: 1, username: "joe", email: "j@x.com", confirmed: true, blocked: false, role: {} })
      : jsonResponse({ ok: true, data: [] })
  );

  const headers = new Headers({ cookie: "valhalla_access=tok" });
  const res = await GET(new Request("http://localhost/api/orders", { headers }));
  assert.equal(res.status, 200);
});

test("GET: quando a sessão é renovada via refresh token, a resposta carrega os novos cookies", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  process.env.AUTH_COOKIE_SECURE = "false";
  const { GET } = await import("./route");

  let meCalls = 0;
  t.mock.method(globalThis, "fetch", async (url: string) => {
    const path = String(url);
    if (path.includes("/api/users/me")) {
      meCalls += 1;
      if (meCalls === 1) return jsonResponse({ error: "unauthorized" }, 401);
      return jsonResponse({ id: 1, username: "joe", email: "joe@example.com", confirmed: true, blocked: false, role: {} });
    }
    if (path.includes("/api/auth/refresh")) {
      return jsonResponse({ jwt: "new-access", refreshToken: "new-refresh" });
    }
    if (path.includes("/api/orders")) {
      return jsonResponse({ ok: true, data: [] });
    }
    throw new Error(`unexpected fetch: ${path}`);
  });

  const headers = new Headers({ cookie: "valhalla_access=expired-access; valhalla_refresh=valid-refresh" });
  const res = await GET(new Request("http://localhost/api/orders", { headers }));
  assert.equal(res.status, 200);

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert.equal(setCookies.length, 2);
  assert.ok(setCookies.some((c) => c.startsWith("valhalla_access=new-access")));
  assert.ok(setCookies.some((c) => c.startsWith("valhalla_refresh=new-refresh")));
});
