# Strapi Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Next.js frontend keep rendering when Strapi is unreachable, by caching the last successful response per fetcher in memory and falling back to it (or a neutral default) on failure, instead of throwing and crashing the whole app.

**Architecture:** Two generic helpers (`withCacheFallback`, `withCacheOrThrow`) wrap each exported function in `app/lib/strapi.ts`, backed by a single module-scoped `Map`. Global/list data (site settings, homepage, categories, products, faqs, policies) always resolves (cache-or-default). Single-item slug lookups (product/category detail) never fabricate a fake "not found" — they serve stale cache or rethrow, caught by new `error.tsx` boundaries.

**Tech Stack:** Next.js 16.2.10 (App Router, TypeScript), Node's built-in `node:test` + `node:assert/strict` test runner (executed via the already-installed `tsx` loader — no new dependencies).

## Global Constraints

- Spec source: `docs/superpowers/specs/2026-08-02-strapi-fallback-design.md`
- No new infra/dependencies (no Redis, no disk cache, no test framework like Jest/Vitest) — in-memory `Map`, tests run via `node --import tsx --test`.
- No fetch timeout/AbortController — only actual fetch rejection or non-OK HTTP response triggers fallback.
- No fabricated business copy in defaults or error UI — neutral empty values / generic Portuguese messages only.
- No change to exported function signatures in `app/lib/strapi.ts` — every page component call site stays untouched.
- This Next.js version (16.2.0+) uses `unstable_retry` (not `reset`) as the recommended error-boundary retry prop — confirmed in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`. Use `unstable_retry` in all new `error.tsx`/`global-error.tsx` files.
- Error boundaries must be Client Components (`"use client"`); `global-error.tsx` must define its own `<html>` and `<body>` and does not support `metadata`/`generateMetadata`.

---

### Task 1: Cache helpers in `strapi.ts` + unit tests

**Files:**
- Modify: `app/lib/strapi.ts` (insert after the `STRAPI_URL` const at line 185, before `strapiFetch`)
- Create: `app/lib/strapi.test.ts`
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Produces: `export async function withCacheFallback<T>(key: string, fetcher: () => Promise<T>, fallback: T): Promise<T>` and `export async function withCacheOrThrow<T>(key: string, fetcher: () => Promise<T>): Promise<T>`, both backed by a shared module-level `const cache = new Map<string, unknown>();`. Later tasks call these two functions by name.

- [ ] **Step 1: Write the failing tests**

Create `app/lib/strapi.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { withCacheFallback, withCacheOrThrow } from "./strapi";

test("withCacheFallback: success returns the value and caches it", async () => {
  const result = await withCacheFallback("wcf-key-1", async () => "fresh", "default");
  assert.equal(result, "fresh");
});

test("withCacheFallback: failure with no prior cache returns the fallback", async () => {
  const result = await withCacheFallback(
    "wcf-key-2",
    async () => {
      throw new Error("strapi down");
    },
    "default"
  );
  assert.equal(result, "default");
});

test("withCacheFallback: failure after a prior success returns the stale cached value", async () => {
  const first = await withCacheFallback("wcf-key-3", async () => "fresh", "default");
  assert.equal(first, "fresh");

  const second = await withCacheFallback(
    "wcf-key-3",
    async () => {
      throw new Error("strapi down");
    },
    "default"
  );
  assert.equal(second, "fresh");
});

test("withCacheOrThrow: success returns the value and caches it", async () => {
  const result = await withCacheOrThrow("wcot-key-1", async () => "fresh");
  assert.equal(result, "fresh");
});

test("withCacheOrThrow: failure with no prior cache rethrows the original error", async () => {
  await assert.rejects(
    () =>
      withCacheOrThrow("wcot-key-2", async () => {
        throw new Error("strapi down");
      }),
    /strapi down/
  );
});

test("withCacheOrThrow: failure after a prior success returns the stale cached value", async () => {
  const first = await withCacheOrThrow("wcot-key-3", async () => "fresh");
  assert.equal(first, "fresh");

  const second = await withCacheOrThrow("wcot-key-3", async () => {
    throw new Error("strapi down");
  });
  assert.equal(second, "fresh");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test app/lib/strapi.test.ts`
Expected: FAIL — `withCacheFallback`/`withCacheOrThrow` are not exported from `./strapi` yet.

- [ ] **Step 3: Implement the helpers**

In `app/lib/strapi.ts`, insert immediately after line 185 (`const STRAPI_URL = ...`) and before the `strapiFetch` function:

```ts
const cache = new Map<string, unknown>();

export async function withCacheFallback<T>(key: string, fetcher: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const data = await fetcher();
    cache.set(key, data);
    return data;
  } catch (err) {
    console.error(`[strapi] fallback for ${key}:`, err);
    return (cache.get(key) as T) ?? fallback;
  }
}

export async function withCacheOrThrow<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const data = await fetcher();
    cache.set(key, data);
    return data;
  } catch (err) {
    if (cache.has(key)) {
      console.error(`[strapi] serving stale cache for ${key}:`, err);
      return cache.get(key) as T;
    }
    throw err;
  }
}
```

- [ ] **Step 4: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "node --import tsx --test app/lib/strapi.test.ts"
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — 6 tests, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add app/lib/strapi.ts app/lib/strapi.test.ts package.json
git commit -m "feat: add cache-fallback helpers for Strapi requests"
```

---

### Task 2: Wrap `getSiteSettings` and `getHomepage` with cache-or-default

**Files:**
- Modify: `app/lib/strapi.ts:253-310` (the two function bodies)
- Create: `app/lib/strapi-fetchers.test.ts`

**Interfaces:**
- Consumes: `withCacheFallback` from Task 1.
- Produces: `getSiteSettings(): Promise<SiteSettings>` and `getHomepage(): Promise<Homepage>` keep their existing signatures but now never throw.

- [ ] **Step 1: Write the failing tests**

Create `app/lib/strapi-fetchers.test.ts`:

```ts
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
```

Note: within this file, `node:test` runs top-level tests in declaration order, so the "goes down after a prior success" tests intentionally run after their matching "Strapi up" test to observe the same module-level cache entry.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test app/lib/strapi-fetchers.test.ts`
Expected: FAIL — `getSiteSettings`/`getHomepage` currently throw on the 500 response instead of returning a default.

- [ ] **Step 3: Wrap the two functions**

Replace `app/lib/strapi.ts:253-279` (`getSiteSettings`):

```ts
const DEFAULT_SITE_SETTINGS: SiteSettings = {
  updatedAt: null,
  whatsappNumber: "",
  showTopBar: false,
  topBarText: "",
  showFab: false,
  footerTagline: "",
  footerLinkColumns: [],
  footerLegalText: "",
  contactEmail: "",
  contactAddress: "",
  contactHours: "",
  aboutEyebrow: "",
  aboutHeadline: "",
  aboutText: "",
  aboutStats: [],
  defaultSeo: null,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const path = "/api/site-setting?populate[footerLinkColumns][populate]=links&populate[aboutStats]=true&populate[defaultSeo]=true";
  return withCacheFallback(
    path,
    async () => {
      const json = await strapiFetch<any>(path);
      const d = json.data;
      return {
        updatedAt: d.updatedAt ?? d.publishedAt ?? d.createdAt ?? null,
        whatsappNumber: d.whatsappNumber,
        showTopBar: d.showTopBar,
        topBarText: d.topBarText,
        showFab: d.showFab,
        footerTagline: d.footerTagline,
        footerLinkColumns: (d.footerLinkColumns || []).map((c: any) => ({
          title: c.title,
          links: (c.links || []).map((l: any) => ({ label: l.label, url: l.url })),
        })),
        footerLegalText: d.footerLegalText,
        contactEmail: d.contactEmail,
        contactAddress: d.contactAddress,
        contactHours: d.contactHours,
        aboutEyebrow: d.aboutEyebrow,
        aboutHeadline: d.aboutHeadline,
        aboutText: d.aboutText,
        aboutStats: (d.aboutStats || []).map((s: any) => ({ value: s.value, label: s.label })),
        defaultSeo: d.defaultSeo ? { metaTitle: d.defaultSeo.metaTitle, metaDescription: d.defaultSeo.metaDescription } : null,
      };
    },
    DEFAULT_SITE_SETTINGS
  );
}
```

Replace `app/lib/strapi.ts:281-310` (`getHomepage`, now shifted down by the inserted `DEFAULT_SITE_SETTINGS` block — locate by function name, not exact line number):

```ts
const DEFAULT_HOMEPAGE: Homepage = {
  hero: {
    eyebrow: "",
    headlineAccent: "",
    headline: "",
    headlineHighlight: "",
    subtext: "",
    ctaLabel: "",
    ctaLink: "",
    secondaryCtaLabel: "",
    secondaryCtaLink: "",
    image: null,
    trustBadges: [],
  },
  benefits: [],
  steps: [],
  testimonials: [],
  whatsappBanner: { headline: "", text: "", buttonLabel: "", buttonLink: "" },
};

export async function getHomepage(): Promise<Homepage> {
  const path =
    "/api/homepage?populate[hero][populate][0]=trustBadges&populate[hero][populate][1]=image&populate[benefits]=true&populate[steps]=true&populate[testimonials]=true&populate[whatsappBanner]=true";
  return withCacheFallback(
    path,
    async () => {
      const json = await strapiFetch<any>(path);
      const d = json.data;
      return {
        hero: {
          eyebrow: d.hero.eyebrow,
          headlineAccent: d.hero.headlineAccent,
          headline: d.hero.headline,
          headlineHighlight: d.hero.headlineHighlight,
          subtext: d.hero.subtext,
          ctaLabel: d.hero.ctaLabel,
          ctaLink: d.hero.ctaLink,
          secondaryCtaLabel: d.hero.secondaryCtaLabel,
          secondaryCtaLink: d.hero.secondaryCtaLink,
          image: mapMedia(d.hero.image),
          trustBadges: (d.hero.trustBadges || []).map((b: any) => ({ text: b.text })),
        },
        benefits: (d.benefits || []).map((b: any) => ({ icon: b.icon, title: b.title, description: b.description })),
        steps: (d.steps || []).map((s: any) => ({ number: s.number, title: s.title, description: s.description })),
        testimonials: (d.testimonials || []).map((t: any) => ({ quote: t.quote, authorName: t.authorName, authorLocation: t.authorLocation })),
        whatsappBanner: {
          headline: d.whatsappBanner.headline,
          text: d.whatsappBanner.text,
          buttonLabel: d.whatsappBanner.buttonLabel,
          buttonLink: d.whatsappBanner.buttonLink,
        },
      };
    },
    DEFAULT_HOMEPAGE
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --import tsx --test app/lib/strapi-fetchers.test.ts`
Expected: PASS — 6 tests, 0 failures.

- [ ] **Step 5: Update the `test` script and run the full suite**

In `package.json`, update the `test` script to run both files:

```json
"test": "node --import tsx --test app/lib/strapi.test.ts app/lib/strapi-fetchers.test.ts"
```

Run: `npm test`
Expected: PASS — 12 tests, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add app/lib/strapi.ts app/lib/strapi-fetchers.test.ts package.json
git commit -m "feat: fall back to cached/default site settings and homepage when Strapi fails"
```

---

### Task 3: Wrap the remaining list fetchers with cache-or-default

**Files:**
- Modify: `app/lib/strapi.ts` (`getCategories`, `getProducts`, `getProductsByCategorySlug`, `getFaqs`, `getPolicies`)
- Modify: `app/lib/strapi-fetchers.test.ts` (append tests)

**Interfaces:**
- Consumes: `withCacheFallback` from Task 1.
- Produces: `getCategories(): Promise<Category[]>`, `getProducts(): Promise<Product[]>`, `getProductsByCategorySlug(slug: string): Promise<Product[]>`, `getFaqs(): Promise<Faq[]>`, `getPolicies(): Promise<Policy[]>` — same signatures, all default to `[]` on total failure.

- [ ] **Step 1: Write the failing tests**

Append to `app/lib/strapi-fetchers.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL on the new tests — these five functions still throw on the 500 response.

- [ ] **Step 3: Wrap the five functions**

Replace the bodies of `getCategories`, `getProducts`, `getProductsByCategorySlug`, `getFaqs`, `getPolicies` in `app/lib/strapi.ts`:

```ts
export async function getCategories(): Promise<Category[]> {
  const path = "/api/categories?populate=products";
  return withCacheFallback(
    path,
    async () => {
      const json = await strapiFetch<any>(path);
      return json.data.map((c: any) => ({
        id: c.id,
        documentId: c.documentId,
        updatedAt: c.updatedAt ?? c.publishedAt ?? c.createdAt ?? null,
        name: c.name,
        slug: c.slug,
        description: c.description,
        productCount: Array.isArray(c.products) ? c.products.length : 0,
      }));
    },
    []
  );
}

export async function getProducts(): Promise<Product[]> {
  const path = `/api/products?${PRODUCT_POPULATE}&pagination[pageSize]=100`;
  return withCacheFallback(
    path,
    async () => {
      const json = await strapiFetch<any>(path);
      return json.data.map(mapProduct);
    },
    []
  );
}

export async function getProductsByCategorySlug(slug: string): Promise<Product[]> {
  const path = `/api/products?filters[category][slug][$eq]=${encodeURIComponent(slug)}&${PRODUCT_POPULATE}&pagination[pageSize]=100`;
  return withCacheFallback(
    path,
    async () => {
      const json = await strapiFetch<any>(path);
      return json.data.map(mapProduct);
    },
    []
  );
}

export async function getFaqs(): Promise<Faq[]> {
  const path = "/api/faqs?sort=order:asc&pagination[pageSize]=100";
  return withCacheFallback(
    path,
    async () => {
      const json = await strapiFetch<any>(path);
      return json.data.map((f: any) => ({ id: f.id, question: f.question, answer: f.answer, order: f.order }));
    },
    []
  );
}

export async function getPolicies(): Promise<Policy[]> {
  const path = "/api/policies?pagination[pageSize]=100";
  return withCacheFallback(
    path,
    async () => {
      const json = await strapiFetch<any>(path);
      return json.data.map((p: any) => ({
        id: p.id,
        documentId: p.documentId,
        updatedAt: p.updatedAt ?? p.publishedAt ?? p.createdAt ?? null,
        title: p.title,
        slug: p.slug,
        body: p.body,
      }));
    },
    []
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests in both files, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add app/lib/strapi.ts app/lib/strapi-fetchers.test.ts
git commit -m "feat: fall back to cached/empty lists for categories, products, faqs and policies"
```

---

### Task 4: Wrap slug lookups with cache-or-throw

**Files:**
- Modify: `app/lib/strapi.ts` (`getCategoryBySlug`, `getProductBySlug`)
- Modify: `app/lib/strapi-fetchers.test.ts` (append tests)

**Interfaces:**
- Consumes: `withCacheOrThrow` from Task 1.
- Produces: `getCategoryBySlug(slug: string): Promise<Category | null>`, `getProductBySlug(slug: string): Promise<Product | null>` — signatures unchanged. `null` still means "genuinely not found" (Strapi responded, no matching record). A Strapi outage with no prior successful lookup for that slug now rejects instead of returning `null`.

- [ ] **Step 1: Write the failing tests**

Append to `app/lib/strapi-fetchers.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL on the two "Strapi up then down -> serves the stale cached ... for that slug" tests only. Today `getCategoryBySlug`/`getProductBySlug` call `strapiFetch` with no caching at all, so the second (down) call in those tests rejects instead of returning the value from the first (up) call. The "genuine not-found" and "rejects with no prior cache" tests already pass against the current code, since it already throws unconditionally on a non-OK response.

- [ ] **Step 3: Wrap the two functions**

Replace `getCategoryBySlug` and `getProductBySlug` in `app/lib/strapi.ts`:

```ts
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const path = `/api/categories?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=products`;
  const json = await withCacheOrThrow(path, () => strapiFetch<any>(path));
  const raw = json.data[0];
  if (!raw) return null;
  return {
    id: raw.id,
    documentId: raw.documentId,
    updatedAt: raw.updatedAt ?? raw.publishedAt ?? raw.createdAt ?? null,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    productCount: Array.isArray(raw.products) ? raw.products.length : 0,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const path = `/api/products?filters[slug][$eq]=${encodeURIComponent(slug)}&${PRODUCT_POPULATE}`;
  const json = await withCacheOrThrow(path, () => strapiFetch<any>(path));
  const raw = json.data[0];
  if (!raw) return null;
  return mapProduct(raw);
}
```

Note: the cache stores the raw `json` response here (not the mapped domain object), because the "genuine not-found" check (`json.data[0]` undefined) must run on every call, including cache hits — otherwise a stale cache could paper over a real deletion. This is a deliberate deviation from Tasks 2–3, where mapping is pure and cheap enough to redo on every call regardless of cache/fallback path; caching post-map there is simpler and equally correct.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests across both files, 0 failures.

- [ ] **Step 5: Run the full validation suite**

Run: `npx tsc --noEmit`
Expected: no type errors.

Run: `npm run lint`
Expected: no lint errors introduced.

- [ ] **Step 6: Commit**

```bash
git add app/lib/strapi.ts app/lib/strapi-fetchers.test.ts
git commit -m "feat: serve stale cache or fail loudly for product/category slug lookups"
```

---

### Task 5: Error boundaries for product and category detail pages

**Files:**
- Create: `app/produto/[slug]/error.tsx`
- Create: `app/categoria/[slug]/error.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure UI, no data fetching — error boundaries are Client Components and cannot `await`).
- Produces: fallback UI shown when `getProductBySlug`/`getCategoryBySlug` reject with no cache (Task 4).

- [ ] **Step 1: Create the product error boundary**

Create `app/produto/[slug]/error.tsx`:

```tsx
"use client";

import Link from "next/link";

export default function ProductError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <section className="max-w-155 my-0 mx-auto py-22.5 px-6 w-full text-center">
      <h1 className="mt-3.5 mx-0 mb-2.5 font-bold text-vh-26 font-space-grotesk">Não conseguimos carregar este produto</h1>
      <p className="mt-0 mx-0 mb-6.5 font-medium text-vh-14/vh-17 font-manrope text-vh-muted">
        Tivemos um problema temporário para buscar essas informações. Tente novamente em instantes.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => unstable_retry()}
          className="vh-btn-lime bg-vh-lime border-0 rounded-vh-11 py-3.75 px-6.5 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink!"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="vh-wa-outline inline-flex items-center bg-transparent border border-vh-wa rounded-vh-11 py-3.5 px-6.5 font-bold text-vh-14 font-space-grotesk text-vh-wa!"
        >
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the category error boundary**

Create `app/categoria/[slug]/error.tsx`:

```tsx
"use client";

import Link from "next/link";

export default function CategoryError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <section className="max-w-155 my-0 mx-auto py-22.5 px-6 w-full text-center">
      <h1 className="mt-3.5 mx-0 mb-2.5 font-bold text-vh-26 font-space-grotesk">Não conseguimos carregar esta categoria</h1>
      <p className="mt-0 mx-0 mb-6.5 font-medium text-vh-14/vh-17 font-manrope text-vh-muted">
        Tivemos um problema temporário para buscar essas informações. Tente novamente em instantes.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => unstable_retry()}
          className="vh-btn-lime bg-vh-lime border-0 rounded-vh-11 py-3.75 px-6.5 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink!"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="vh-wa-outline inline-flex items-center bg-transparent border border-vh-wa rounded-vh-11 py-3.5 px-6.5 font-bold text-vh-14 font-space-grotesk text-vh-wa!"
        >
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify the build picks up the new files**

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add "app/produto/[slug]/error.tsx" "app/categoria/[slug]/error.tsx"
git commit -m "feat: add error boundaries for product and category detail pages"
```

---

### Task 6: Root-level `global-error.tsx` safety net

**Files:**
- Create: `app/global-error.tsx`

**Interfaces:**
- Consumes: nothing (last-resort UI, layout itself no longer throws after Task 2/3, but this guards against any other unexpected exception thrown while rendering the root layout or its children).

- [ ] **Step 1: Create the global error boundary**

Create `app/global-error.tsx`:

```tsx
"use client";

import "./globals.css";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <section className="max-w-155 my-0 mx-auto py-22.5 px-6 w-full text-center">
          <h1 className="mt-3.5 mx-0 mb-2.5 font-bold text-vh-26 font-space-grotesk">O site está temporariamente indisponível</h1>
          <p className="mt-0 mx-0 mb-6.5 font-medium text-vh-14/vh-17 font-manrope text-vh-muted">
            Estamos com um problema técnico. Tente novamente em instantes.
          </p>
          <button
            onClick={() => unstable_retry()}
            className="vh-btn-lime bg-vh-lime border-0 rounded-vh-11 py-3.75 px-6.5 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink!"
          >
            Tentar novamente
          </button>
        </section>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify the build picks up the new file**

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add app/global-error.tsx
git commit -m "feat: add global-error safety net for root layout failures"
```

---

### Task 7: Full validation and manual outage verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`
Expected: all tests pass.

Run: `npx tsc --noEmit`
Expected: no type errors.

Run: `npm run lint`
Expected: no lint errors.

Run: `npm run build`
Expected: production build succeeds.

- [ ] **Step 2: Manual outage check — first request ever, Strapi down**

Set `STRAPI_URL` to an unreachable address (e.g. `http://localhost:19999`), start the app fresh (`npm run start` after `npm run build`, or `npm run dev`), and load `/`.
Expected: homepage renders (empty hero/nav, since no cache exists yet and this is a cold start) instead of crashing or showing a Next.js error overlay.

- [ ] **Step 3: Manual outage check — cache warm, then Strapi drops**

With a real Strapi running and `STRAPI_URL` pointed at it, load `/`, a category page, and a product page once each (populates the cache). Then stop Strapi (or point `STRAPI_URL` at an unreachable address) and reload the same three pages.
Expected: all three render identically to before, using stale cached data, with `console.error` lines logged server-side (visible in the terminal running `next dev`/`next start`) — no visible banner or error UI to the user.

- [ ] **Step 4: Manual outage check — never-visited slug, Strapi down**

With Strapi still down/unreachable and no warm cache for it, visit a product or category slug that was never loaded in this process (e.g. append a query string or restart the process, then visit `/produto/<slug-never-hit>`).
Expected: the new `error.tsx` fallback renders ("Não conseguimos carregar este produto" / "...esta categoria") instead of a white screen or a false 404.

- [ ] **Step 5: Report results**

Summarize in the PR/commit description: which of the 7 tasks are done, the commands run in Step 1 and their pass/fail status, and confirmation that the three manual scenarios in Steps 2–4 behaved as expected.
