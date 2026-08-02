# Strapi Fallback Design

## Problem

`app/lib/strapi.ts` has zero resilience against Strapi being down. `strapiFetch` uses `cache: "no-store"` and throws on any non-OK response or network error, with no try/catch anywhere. Because `app/layout.tsx` calls `getSiteSettings`, `getCategories`, and `getProducts` directly (every route renders through the root layout), a Strapi outage currently takes down the entire site. There is no `error.tsx`, `global-error.tsx`, or `loading.tsx` anywhere in `app/`, and no cache/storage layer beyond client-side `localStorage` for the cart (unrelated).

Rendering is fully dynamic SSR per request (no ISR, no `generateStaticParams`, no `revalidate`) — so "Strapi down" is purely a runtime failure mode, not a stale-build problem.

## Goals

- Site keeps rendering (nav, homepage, product/category pages) when Strapi is unreachable or errors, using the last successful response instead of crashing.
- No fake/invented business content — fallback defaults are structurally neutral (empty strings/arrays), never fabricated copy.
- Silent to the end user: no visible "degraded mode" banner. Failures are logged server-side only.
- Genuine "record not found" (e.g. bad product slug while Strapi is healthy) must not be confused with "Strapi is down" — the former still returns `null` → `notFound()` as today.

## Non-goals

- No new infra (Redis, disk cache, external stores). In-memory per-process cache, accepted to be per-replica and reset on restart/redeploy.
- No fetch timeout/AbortController — only actual fetch rejections and non-OK HTTP responses trigger fallback (matches current error surface, no new behavior for hangs).
- No change to any page component call sites — exported function signatures from `strapi.ts` stay the same.
- No revalidate/ISR changes — rendering strategy stays fully dynamic SSR.

## Architecture

Two generic helpers added to `app/lib/strapi.ts`, backed by a single module-scoped `Map`:

```ts
const cache = new Map<string, unknown>();

async function withCacheFallback<T>(key: string, fetcher: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const data = await fetcher();
    cache.set(key, data);
    return data;
  } catch (err) {
    console.error(`[strapi] fallback for ${key}:`, err);
    return (cache.get(key) as T) ?? fallback;
  }
}

async function withCacheOrThrow<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
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

The cache stores the **final mapped domain object** (e.g. `SiteSettings`, `Product[]`), not the raw Strapi JSON — this keeps defaults defined once against the existing TS interfaces, decoupled from Strapi's raw field naming. Cache key is the request path string (already unique per function + params, since slug/filter values are part of the path).

## Fetcher classification

**Cache-or-default** — global/list data. Must always resolve so the rest of the page (nav, layout) still renders:

- `getSiteSettings`
- `getHomepage`
- `getCategories`
- `getProducts`
- `getProductsByCategorySlug`
- `getFaqs`
- `getPolicies`

**Cache-or-throw** — single-item lookup by slug. No fake default: a `null` here would trigger `notFound()`, misrepresenting an outage as "product doesn't exist". On failure, serve stale cache if the slug was fetched successfully before; otherwise rethrow so the nearest `error.tsx` catches it:

- `getCategoryBySlug`
- `getProductBySlug`

Each exported function wraps its existing fetch+map body in the appropriate helper, keyed by its request path:

```ts
export async function getSiteSettings(): Promise<SiteSettings> {
  const path = "/api/site-setting?populate[footerLinkColumns][populate]=links&populate[aboutStats]=true&populate[defaultSeo]=true";
  return withCacheFallback(path, async () => {
    const json = await strapiFetch<any>(path);
    const d = json.data;
    return { /* existing mapping, unchanged */ };
  }, DEFAULT_SITE_SETTINGS);
}
```

Defaults (neutral, no invented copy):

```ts
const DEFAULT_SITE_SETTINGS: SiteSettings = {
  updatedAt: null, whatsappNumber: "", showTopBar: false, topBarText: "",
  showFab: false, footerTagline: "", footerLinkColumns: [], footerLegalText: "",
  contactEmail: "", contactAddress: "", contactHours: "",
  aboutEyebrow: "", aboutHeadline: "", aboutText: "", aboutStats: [], defaultSeo: null,
};

const DEFAULT_HOMEPAGE: Homepage = {
  hero: {
    eyebrow: "", headlineAccent: "", headline: "", headlineHighlight: "", subtext: "",
    ctaLabel: "", ctaLink: "", secondaryCtaLabel: "", secondaryCtaLink: "",
    image: null, trustBadges: [],
  },
  benefits: [], steps: [], testimonials: [],
  whatsappBanner: { headline: "", text: "", buttonLabel: "", buttonLink: "" },
};
```

`getCategories`, `getProducts`, `getProductsByCategorySlug`, `getFaqs`, `getPolicies` default to `[]`.

`getProductBySlug` / `getCategoryBySlug` pass no default (use `withCacheOrThrow`); the existing "`raw` undefined → return `null`" logic stays outside the helper, untouched, so genuine not-found behavior is unaffected.

## Error boundaries

`withCacheOrThrow` can still rethrow (slug never fetched successfully before + Strapi down). Three new files, all minimal client components matching existing site UI (no invented brand copy):

- `app/produto/[slug]/error.tsx` — "produto temporariamente indisponível" message + retry button (`reset()`)
- `app/categoria/[slug]/error.tsx` — same pattern for categories
- `app/global-error.tsx` — last-resort net for `layout.tsx` itself; should rarely trigger since layout's fetchers (`getSiteSettings`, `getCategories`, `getProducts`) are all cache-or-default and never throw, but guards against unexpected bugs (e.g. a mapping error)

## Data flow

```
page/layout → getX() → withCacheFallback | withCacheOrThrow → strapiFetch → fetch(Strapi)
  success              → map, cache.set(key, result), return
  failure + cached      → console.error, return stale
  failure + no cache    → cache-or-default: return default
                        → cache-or-throw: rethrow → nearest error.tsx
```

## Testing

- Unit tests for `withCacheFallback` and `withCacheOrThrow` (mock the fetcher function): success caches; failure with prior cache returns stale + logs; failure with no cache returns default (cache-or-default) or rethrows (cache-or-throw).
- Manual verification: point `STRAPI_URL` at an unreachable host (or stop the local Strapi container), then:
  - Load a page once while Strapi is up (populates cache), stop Strapi, reload — site renders identically from stale cache.
  - Cold-start with Strapi already down — homepage/nav render with empty defaults instead of crashing.
  - Visit a product/category slug never loaded before, with Strapi down — `error.tsx` shows instead of a white screen or false 404.

## Scope

Files touched: `app/lib/strapi.ts` only, plus three new files (`app/produto/[slug]/error.tsx`, `app/categoria/[slug]/error.tsx`, `app/global-error.tsx`). No page component call sites change — exported function signatures are unchanged.
