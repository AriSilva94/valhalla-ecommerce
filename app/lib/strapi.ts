import { unstable_rethrow } from "next/navigation";

export interface StrapiMedia {
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
}

export interface Spec {
  key: string;
  value: string;
}

export interface Color {
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: number;
  sku: string;
  color: Color;
  configLabel: string;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
}

export interface Brand {
  id: number;
  documentId: string;
  name: string;
  slug: string;
}

export interface Category {
  id: number;
  documentId: string;
  updatedAt: string | null;
  name: string;
  slug: string;
  description: string;
  productCount: number;
}

export interface Tag {
  id: number;
  documentId: string;
  name: string;
  slug: string;
}

export interface Seo {
  metaTitle: string;
  metaDescription: string;
}

export interface Product {
  id: number;
  documentId: string;
  updatedAt: string | null;
  name: string;
  slug: string;
  basePrice: number;
  variantGroupLabel: string | null;
  specs: Spec[];
  description: string;
  warranty: string;
  brand: Brand | null;
  category: Category | null;
  tags: Tag[];
  variants: ProductVariant[];
  seo: Seo | null;
  mainImage: StrapiMedia | null;
  gallery: StrapiMedia[];
}

export interface TrustBadge {
  text: string;
}

export interface Hero {
  eyebrow: string;
  headlineAccent: string;
  headline: string;
  headlineHighlight: string;
  subtext: string;
  ctaLabel: string;
  ctaLink: string;
  secondaryCtaLabel: string;
  secondaryCtaLink: string;
  image: StrapiMedia | null;
  trustBadges: TrustBadge[];
}

export interface Benefit {
  icon: string;
  title: string;
  description: string;
}

export interface Step {
  number: string;
  title: string;
  description: string;
}

export interface Testimonial {
  quote: string;
  authorName: string;
  authorLocation: string;
}

export interface Banner {
  headline: string;
  text: string;
  buttonLabel: string;
  buttonLink: string;
}

export interface Homepage {
  hero: Hero;
  benefits: Benefit[];
  steps: Step[];
  testimonials: Testimonial[];
  whatsappBanner: Banner;
}

export interface LinkItem {
  label: string;
  url: string;
}

export interface LinkColumn {
  title: string;
  links: LinkItem[];
}

export interface Stat {
  value: string;
  label: string;
}

export interface SiteSettings {
  updatedAt: string | null;
  whatsappNumber: string;
  showTopBar: boolean;
  topBarText: string;
  showFab: boolean;
  footerTagline: string;
  footerLinkColumns: LinkColumn[];
  footerLegalText: string;
  contactEmail: string;
  contactAddress: string;
  contactHours: string;
  aboutEyebrow: string;
  aboutHeadline: string;
  aboutText: string;
  aboutStats: Stat[];
  defaultSeo: Seo | null;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  order: number;
}

export interface Policy {
  id: number;
  documentId: string;
  updatedAt: string | null;
  title: string;
  slug: string;
  body: string;
}


interface RawTimestamps {
  updatedAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
}

interface RawMedia {
  url?: string | null;
  alternativeText?: string | null;
  width: number;
  height: number;
}

interface RawVariant {
  id: number;
  sku: string;
  colorName?: string | null;
  colorHex?: string | null;
  configLabel?: string | null;
  price: number;
  compareAtPrice?: number | null;
  available: boolean;
}

interface RawSpec {
  key: string;
  value: string;
}

interface RawBrand {
  id: number;
  documentId: string;
  name: string;
  slug: string;
}

interface RawTag {
  id: number;
  documentId: string;
  name: string;
  slug: string;
}

interface RawSeo {
  metaTitle: string;
  metaDescription: string;
}

interface RawCategory extends RawTimestamps {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description: string;
  products?: unknown[] | null;
}

interface RawProduct extends RawTimestamps {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  basePrice: number;
  variantGroupLabel?: string | null;
  specs?: RawSpec[] | null;
  description: string;
  warranty: string;
  brand?: RawBrand | null;
  category?: RawCategory | null;
  tags?: RawTag[] | null;
  variants?: RawVariant[] | null;
  seo?: RawSeo | null;
  mainImage?: RawMedia | null;
  gallery?: RawMedia[] | null;
}

interface RawLinkColumn {
  title: string;
  links?: { label: string; url: string }[] | null;
}

interface RawSiteSetting extends RawTimestamps {
  whatsappNumber: string;
  showTopBar: boolean;
  topBarText: string;
  showFab: boolean;
  footerTagline: string;
  footerLinkColumns?: RawLinkColumn[] | null;
  footerLegalText: string;
  contactEmail: string;
  contactAddress: string;
  contactHours: string;
  aboutEyebrow: string;
  aboutHeadline: string;
  aboutText: string;
  aboutStats?: { value: string; label: string }[] | null;
  defaultSeo?: RawSeo | null;
}

interface RawHomepage {
  hero: {
    eyebrow: string;
    headlineAccent: string;
    headline: string;
    headlineHighlight: string;
    subtext: string;
    ctaLabel: string;
    ctaLink: string;
    secondaryCtaLabel: string;
    secondaryCtaLink: string;
    image?: RawMedia | null;
    trustBadges?: { text: string }[] | null;
  };
  benefits?: { icon: string; title: string; description: string }[] | null;
  steps?: { number: string; title: string; description: string }[] | null;
  testimonials?: { quote: string; authorName: string; authorLocation: string }[] | null;
  whatsappBanner: { headline: string; text: string; buttonLabel: string; buttonLink: string };
}

interface RawFaq {
  id: number;
  question: string;
  answer: string;
  order: number;
}

interface RawPolicy extends RawTimestamps {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  body: string;
}

interface StrapiSingle<T> {
  data: T;
}

interface StrapiList<T> {
  data: T[];
}

export function normalizeStrapiUrl(raw: string | undefined): string {
  return (raw?.trim() || "http://localhost:1337").replace(/\/+$/, "");
}

const STRAPI_URL = normalizeStrapiUrl(process.env.STRAPI_URL);

const CACHE_MAX_ENTRIES = 500;

// Stores shared references — callers must not mutate cached values in place.
const cache = new Map<string, unknown>();

// FIFO eviction cap so cache growth stays bounded even when the key space is
// attacker-controlled (e.g. a slug embedded in the request path). The 500
// global/list keys are rewritten on every successful request, so they stay
// "hot" and are never the oldest entry under normal traffic; only cold,
// rarely-hit slug keys churn, degrading to the already-supported
// "slug never fetched before" path.
function cacheSet(key: string, value: unknown): void {
  if (!cache.has(key) && cache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, value);
}

export async function withCacheFallback<T>(key: string, fetcher: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const data = await fetcher();
    cacheSet(key, data);
    return data;
  } catch (err) {
    unstable_rethrow(err);
    console.error(`[strapi] fallback for ${key}:`, err);
    return (cache.get(key) as T) ?? fallback;
  }
}

export async function withCacheOrThrow<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const data = await fetcher();
    cacheSet(key, data);
    return data;
  } catch (err) {
    unstable_rethrow(err);
    if (cache.has(key)) {
      console.error(`[strapi] serving stale cache for ${key}:`, err);
      return cache.get(key) as T;
    }
    console.error(`[strapi] no cache available for ${key}, rethrowing:`, err);
    throw err;
  }
}

async function strapiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Strapi request failed: ${path} -> ${res.status}`);
  }
  return res.json();
}

function mapVariant(raw: RawVariant): ProductVariant {
  return {
    id: raw.id,
    sku: raw.sku,
    color: { name: raw.colorName ?? "", hex: raw.colorHex ?? "" },
    configLabel: raw.configLabel ?? "",
    price: raw.price,
    compareAtPrice: raw.compareAtPrice ?? null,
    available: raw.available,
  };
}

// Media lives on the storage provider (R2), so `url` is already absolute.
function mapMedia(raw: RawMedia | null | undefined): StrapiMedia | null {
  if (!raw?.url) return null;
  return {
    url: raw.url,
    alternativeText: raw.alternativeText ?? null,
    width: raw.width,
    height: raw.height,
  };
}

function mapProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    documentId: raw.documentId,
    updatedAt: raw.updatedAt ?? raw.publishedAt ?? raw.createdAt ?? null,
    name: raw.name,
    slug: raw.slug,
    basePrice: raw.basePrice,
    variantGroupLabel: raw.variantGroupLabel ?? null,
    specs: (raw.specs || []).map((s) => ({ key: s.key, value: s.value })),
    description: raw.description,
    warranty: raw.warranty,
    brand: raw.brand ? { id: raw.brand.id, documentId: raw.brand.documentId, name: raw.brand.name, slug: raw.brand.slug } : null,
    category: raw.category
      ? {
          id: raw.category.id,
          documentId: raw.category.documentId,
          updatedAt: raw.category.updatedAt ?? raw.category.publishedAt ?? raw.category.createdAt ?? null,
          name: raw.category.name,
          slug: raw.category.slug,
          description: raw.category.description,
          productCount: 0,
        }
      : null,
    tags: (raw.tags || []).map((t) => ({ id: t.id, documentId: t.documentId, name: t.name, slug: t.slug })),
    variants: (raw.variants || []).map(mapVariant),
    seo: raw.seo ? { metaTitle: raw.seo.metaTitle, metaDescription: raw.seo.metaDescription } : null,
    mainImage: mapMedia(raw.mainImage),
    gallery: (raw.gallery || []).map(mapMedia).filter(Boolean) as StrapiMedia[],
  };
}

const PRODUCT_POPULATE =
  "populate[brand]=true&populate[category]=true&populate[tags]=true&populate[specs]=true&populate[variants][populate]=image&populate[seo][populate]=*&populate[mainImage]=true&populate[gallery]=true";

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
      const json = await strapiFetch<StrapiSingle<RawSiteSetting>>(path);
      const d = json.data;
      return {
        updatedAt: d.updatedAt ?? d.publishedAt ?? d.createdAt ?? null,
        whatsappNumber: d.whatsappNumber,
        showTopBar: d.showTopBar,
        topBarText: d.topBarText,
        showFab: d.showFab,
        footerTagline: d.footerTagline,
        footerLinkColumns: (d.footerLinkColumns || []).map((c) => ({
          title: c.title,
          links: (c.links || []).map((l) => ({ label: l.label, url: l.url })),
        })),
        footerLegalText: d.footerLegalText,
        contactEmail: d.contactEmail,
        contactAddress: d.contactAddress,
        contactHours: d.contactHours,
        aboutEyebrow: d.aboutEyebrow,
        aboutHeadline: d.aboutHeadline,
        aboutText: d.aboutText,
        aboutStats: (d.aboutStats || []).map((s) => ({ value: s.value, label: s.label })),
        defaultSeo: d.defaultSeo ? { metaTitle: d.defaultSeo.metaTitle, metaDescription: d.defaultSeo.metaDescription } : null,
      };
    },
    DEFAULT_SITE_SETTINGS
  );
}

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
      const json = await strapiFetch<StrapiSingle<RawHomepage>>(path);
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
          trustBadges: (d.hero.trustBadges || []).map((b) => ({ text: b.text })),
        },
        benefits: (d.benefits || []).map((b) => ({ icon: b.icon, title: b.title, description: b.description })),
        steps: (d.steps || []).map((s) => ({ number: s.number, title: s.title, description: s.description })),
        testimonials: (d.testimonials || []).map((t) => ({ quote: t.quote, authorName: t.authorName, authorLocation: t.authorLocation })),
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

export async function getCategories(): Promise<Category[]> {
  const path = "/api/categories?populate=products&sort[0]=sortOrder:asc&sort[1]=name:asc";
  return withCacheFallback(
    path,
    async () => {
      const json = await strapiFetch<StrapiList<RawCategory>>(path);
      return json.data.map((c) => ({
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

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const path = `/api/categories?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=products`;
  const json = await withCacheOrThrow(path, () => strapiFetch<StrapiList<RawCategory>>(path));
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

export async function getProducts(): Promise<Product[]> {
  const path = `/api/products?${PRODUCT_POPULATE}&pagination[pageSize]=100`;
  return withCacheFallback(
    path,
    async () => {
      const json = await strapiFetch<StrapiList<RawProduct>>(path);
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
      const json = await strapiFetch<StrapiList<RawProduct>>(path);
      return json.data.map(mapProduct);
    },
    []
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const path = `/api/products?filters[slug][$eq]=${encodeURIComponent(slug)}&${PRODUCT_POPULATE}`;
  const json = await withCacheOrThrow(path, () => strapiFetch<StrapiList<RawProduct>>(path));
  const raw = json.data[0];
  if (!raw) return null;
  return mapProduct(raw);
}

export async function getFaqs(): Promise<Faq[]> {
  const path = "/api/faqs?sort=order:asc&pagination[pageSize]=100";
  return withCacheFallback(
    path,
    async () => {
      const json = await strapiFetch<StrapiList<RawFaq>>(path);
      return json.data.map((f) => ({ id: f.id, question: f.question, answer: f.answer, order: f.order }));
    },
    []
  );
}

export async function getPolicies(): Promise<Policy[]> {
  const path = "/api/policies?pagination[pageSize]=100";
  return withCacheFallback(
    path,
    async () => {
      const json = await strapiFetch<StrapiList<RawPolicy>>(path);
      return json.data.map((p) => ({
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
