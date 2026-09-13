import test from "node:test";
import assert from "node:assert/strict";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

test("GET: 404 quando o pedido não é encontrado", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { GET } = await import("./route");

  t.mock.method(globalThis, "fetch", async (url: string) =>
    url.includes("/api/users/me")
      ? jsonResponse({ id: 1, username: "joe", email: "j@x.com", confirmed: true, blocked: false, role: {} })
      : jsonResponse({}, 404)
  );

  const headers = new Headers({ cookie: "valhalla_access=tok" });
  const res = await GET(new Request("http://localhost/api/orders/999", { headers }), {
    params: Promise.resolve({ id: "999" }),
  });
  assert.equal(res.status, 404);
});
