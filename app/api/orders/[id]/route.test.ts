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

test("GET: anexa productImageUrl a cada item buscando o produto atual", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  process.env.STRAPI_URL = "http://strapi.internal";
  const { GET } = await import("./route");

  const order = {
    id: 7,
    items: [
      { productSlug: "air-cooler-z2", productName: "Air Cooler Z2", variantSku: "S1", colorName: "Preto", configLabel: "Padrão", unitPrice: 99.99, qty: 1 },
    ],
    totalAmount: 99.99,
    status: "paid",
    asaasInvoiceUrl: null,
    pixQrCodeImage: null,
    pixCopyPaste: null,
    pixExpiration: null,
    createdAt: "2026-09-13T10:00:00.000Z",
  };

  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("/api/users/me")) {
      return jsonResponse({ id: 1, username: "joe", email: "j@x.com", confirmed: true, blocked: false, role: {} });
    }
    if (url.includes("/api/orders/7")) {
      return jsonResponse({ ok: true, data: order });
    }
    if (url.includes("/api/products") && url.includes("air-cooler-z2")) {
      return jsonResponse({
        data: [{ id: 1, documentId: "d1", updatedAt: null, name: "Air Cooler Z2", slug: "air-cooler-z2", mainImage: { url: "https://cdn.test/air-cooler.png", alternativeText: null, width: 1, height: 1 } }],
      });
    }
    return jsonResponse({});
  });

  const headers = new Headers({ cookie: "valhalla_access=tok" });
  const res = await GET(new Request("http://localhost/api/orders/7", { headers }), {
    params: Promise.resolve({ id: "7" }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.data.items[0].productImageUrl, "https://cdn.test/air-cooler.png");
});

test("GET: 404 com id não numérico sem chamar checkoutClient.getOrder", async (t) => {
  process.env.STRAPI_INTERNAL_URL = "http://strapi.internal";
  const { GET } = await import("./route");

  let ordersEndpointCalled = false;
  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("/api/users/me")) {
      return jsonResponse({ id: 1, username: "joe", email: "j@x.com", confirmed: true, blocked: false, role: {} });
    }
    if (url.includes("/api/orders/")) {
      ordersEndpointCalled = true;
    }
    return jsonResponse({});
  });

  const headers = new Headers({ cookie: "valhalla_access=tok" });
  const res = await GET(new Request("http://localhost/api/orders/abc", { headers }), {
    params: Promise.resolve({ id: "abc" }),
  });
  assert.equal(res.status, 404);
  assert.equal(ordersEndpointCalled, false, "checkoutClient.getOrder should never call the Strapi orders endpoint");
});
