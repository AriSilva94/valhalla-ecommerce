import test from "node:test";
import assert from "node:assert/strict";
import { getSiteSettings, getHomepage } from "./strapi";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

const RAW_SITE_SETTINGS = {
  data: {
    updatedAt: "2026-01-01T00:00:00.000Z",
    whatsappNumber: "5511999999999",
    showTopBar: true,
    topBarText: "Frete grátis acima de R$199",
    showFab: true,
    footerTagline: "Tecnologia para todos",
    footerLinkColumns: [{ title: "Institucional", links: [{ label: "Sobre", url: "/sobre" }] }],
    footerLegalText: "CNPJ 00.000.000/0001-00",
    contactEmail: "contato@valhalla.com",
    contactAddress: "Rua Teste, 123",
    contactHours: "Seg a Sex, 9h-18h",
    aboutEyebrow: "Quem somos",
    aboutHeadline: "Nossa história",
    aboutText: "Texto institucional de teste.",
    aboutStats: [{ value: "10k", label: "Clientes" }],
    defaultSeo: { metaTitle: "Valhalla", metaDescription: "Loja de tecnologia" },
  },
};

test("getSiteSettings: no prior cache, Strapi down -> returns neutral default", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const settings = await getSiteSettings();
  assert.equal(settings.whatsappNumber, "");
  assert.equal(settings.showTopBar, false);
  assert.deepEqual(settings.footerLinkColumns, []);
});

test("getSiteSettings: Strapi up -> returns mapped data and caches it", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(RAW_SITE_SETTINGS));
  const settings = await getSiteSettings();
  assert.equal(settings.whatsappNumber, "5511999999999");
  assert.equal(settings.showTopBar, true);
  assert.equal(settings.footerLinkColumns[0].title, "Institucional");
});

test("getSiteSettings: Strapi goes down after a prior success -> returns stale cached data", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const settings = await getSiteSettings();
  assert.equal(settings.whatsappNumber, "5511999999999");
  assert.equal(settings.showTopBar, true);
});

const RAW_HOMEPAGE = {
  data: {
    hero: {
      eyebrow: "Novidade",
      headlineAccent: "A melhor",
      headline: "loja de tecnologia",
      headlineHighlight: "do Brasil",
      subtext: "Produtos com garantia e entrega rápida.",
      ctaLabel: "Comprar agora",
      ctaLink: "/busca",
      secondaryCtaLabel: "Fale conosco",
      secondaryCtaLink: "/contato",
      image: { url: "https://cdn.example.com/hero.jpg", alternativeText: null, width: 800, height: 600 },
      trustBadges: [{ text: "Entrega rápida" }],
    },
    benefits: [{ icon: "truck", title: "Entrega", description: "Rápida e segura" }],
    steps: [{ number: "1", title: "Escolha", description: "Seu produto" }],
    testimonials: [{ quote: "Ótimo!", authorName: "Ana", authorLocation: "SP" }],
    whatsappBanner: { headline: "Fale com a gente", text: "Tire suas dúvidas", buttonLabel: "Chamar", buttonLink: "https://wa.me/5511999999999" },
  },
};

test("getHomepage: no prior cache, Strapi down -> returns neutral default", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const homepage = await getHomepage();
  assert.equal(homepage.hero.headline, "");
  assert.deepEqual(homepage.benefits, []);
  assert.equal(homepage.hero.image, null);
});

test("getHomepage: Strapi up -> returns mapped data and caches it", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(RAW_HOMEPAGE));
  const homepage = await getHomepage();
  assert.equal(homepage.hero.headline, "loja de tecnologia");
  assert.equal(homepage.benefits[0].title, "Entrega");
});

test("getHomepage: Strapi goes down after a prior success -> returns stale cached data", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const homepage = await getHomepage();
  assert.equal(homepage.hero.headline, "loja de tecnologia");
});

import { getCategories, getProducts, getProductsByCategorySlug, getFaqs, getPolicies } from "./strapi";

const RAW_CATEGORY = {
  id: 1,
  documentId: "cat-1",
  updatedAt: "2026-01-01T00:00:00.000Z",
  name: "Notebooks",
  slug: "notebooks",
  description: "Notebooks para todos os usos",
  products: [{ id: 10 }, { id: 11 }],
};

test("getCategories: Strapi down, no prior cache -> returns []", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const categories = await getCategories();
  assert.deepEqual(categories, []);
});

test("getCategories: Strapi up -> returns mapped data, then serves it as stale on the next failure", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ data: [RAW_CATEGORY] }));
  const fresh = await getCategories();
  assert.equal(fresh[0].name, "Notebooks");
  assert.equal(fresh[0].productCount, 2);

  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const stale = await getCategories();
  assert.equal(stale[0].name, "Notebooks");
});

const RAW_PRODUCT = {
  id: 20,
  documentId: "prod-20",
  updatedAt: "2026-01-01T00:00:00.000Z",
  name: "Notebook Gamer",
  slug: "notebook-gamer",
  basePrice: 4999,
  variantGroupLabel: null,
  specs: [],
  description: "Notebook para jogos",
  warranty: "12 meses",
  brand: null,
  category: null,
  tags: [],
  variants: [],
  seo: null,
  mainImage: null,
  gallery: [],
};

test("getProducts: Strapi down, no prior cache -> returns []", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const products = await getProducts();
  assert.deepEqual(products, []);
});

test("getProducts: Strapi up -> returns mapped data, then serves it as stale on the next failure", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ data: [RAW_PRODUCT] }));
  const fresh = await getProducts();
  assert.equal(fresh[0].name, "Notebook Gamer");

  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const stale = await getProducts();
  assert.equal(stale[0].name, "Notebook Gamer");
});

test("getProductsByCategorySlug: Strapi down, no prior cache -> returns []", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const products = await getProductsByCategorySlug("notebooks");
  assert.deepEqual(products, []);
});

test("getProductsByCategorySlug: Strapi up -> returns mapped data, then serves it as stale on the next failure", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ data: [RAW_PRODUCT] }));
  const fresh = await getProductsByCategorySlug("notebooks");
  assert.equal(fresh[0].name, "Notebook Gamer");

  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const stale = await getProductsByCategorySlug("notebooks");
  assert.equal(stale[0].name, "Notebook Gamer");
});

test("getFaqs: Strapi down, no prior cache -> returns []", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const faqs = await getFaqs();
  assert.deepEqual(faqs, []);
});

test("getFaqs: Strapi up -> returns mapped data, then serves it as stale on the next failure", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ data: [{ id: 1, question: "Q?", answer: "A.", order: 1 }] }));
  const fresh = await getFaqs();
  assert.equal(fresh[0].question, "Q?");

  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const stale = await getFaqs();
  assert.equal(stale[0].question, "Q?");
});

test("getPolicies: Strapi down, no prior cache -> returns []", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const policies = await getPolicies();
  assert.deepEqual(policies, []);
});

test("getPolicies: Strapi up -> returns mapped data, then serves it as stale on the next failure", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ data: [{ id: 1, documentId: "pol-1", updatedAt: null, title: "Troca", slug: "troca", body: "Texto." }] }));
  const fresh = await getPolicies();
  assert.equal(fresh[0].title, "Troca");

  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const stale = await getPolicies();
  assert.equal(stale[0].title, "Troca");
});

import { getCategoryBySlug, getProductBySlug } from "./strapi";

test("getCategoryBySlug: Strapi responds with no match -> returns null (genuine not-found, not an outage)", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ data: [] }));
  const category = await getCategoryBySlug("categoria-inexistente");
  assert.equal(category, null);
});

test("getCategoryBySlug: Strapi down, slug never fetched before -> rejects instead of returning a fake null", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  await assert.rejects(() => getCategoryBySlug("notebooks-nunca-visto"));
});

test("getCategoryBySlug: Strapi up then down -> serves the stale cached category for that slug", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ data: [RAW_CATEGORY] }));
  const fresh = await getCategoryBySlug("notebooks");
  assert.equal(fresh?.name, "Notebooks");

  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const stale = await getCategoryBySlug("notebooks");
  assert.equal(stale?.name, "Notebooks");
});

test("getProductBySlug: Strapi responds with no match -> returns null (genuine not-found, not an outage)", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ data: [] }));
  const product = await getProductBySlug("produto-inexistente");
  assert.equal(product, null);
});

test("getProductBySlug: Strapi down, slug never fetched before -> rejects instead of returning a fake null", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  await assert.rejects(() => getProductBySlug("notebook-gamer-nunca-visto"));
});

test("getProductBySlug: Strapi up then down -> serves the stale cached product for that slug", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ data: [RAW_PRODUCT] }));
  const fresh = await getProductBySlug("notebook-gamer");
  assert.equal(fresh?.name, "Notebook Gamer");

  t.mock.method(globalThis, "fetch", async () => jsonResponse(null, 500));
  const stale = await getProductBySlug("notebook-gamer");
  assert.equal(stale?.name, "Notebook Gamer");
});
