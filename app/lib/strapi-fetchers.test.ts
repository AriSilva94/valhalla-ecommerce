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
