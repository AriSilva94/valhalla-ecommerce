export interface StrapiMedia {
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
}

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

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";

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

async function strapiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Strapi request failed: ${path} -> ${res.status}`);
  }
  return res.json();
}

function mapVariant(raw: any): ProductVariant {
  return {
    id: raw.id,
    sku: raw.sku,
    color: { name: raw.colorName ?? "", hex: raw.colorHex ?? "#000000" },
    configLabel: raw.configLabel ?? "",
    price: raw.price,
    compareAtPrice: raw.compareAtPrice ?? null,
    available: raw.available,
  };
}

// Media lives on the storage provider (R2), so `url` is already absolute.
function mapMedia(raw: any): StrapiMedia | null {
  if (!raw?.url) return null;
  return {
    url: raw.url,
    alternativeText: raw.alternativeText ?? null,
    width: raw.width,
    height: raw.height,
  };
}

function mapProduct(raw: any): Product {
  return {
    id: raw.id,
    documentId: raw.documentId,
    updatedAt: raw.updatedAt ?? raw.publishedAt ?? raw.createdAt ?? null,
    name: raw.name,
    slug: raw.slug,
    basePrice: raw.basePrice,
    variantGroupLabel: raw.variantGroupLabel ?? null,
    specs: (raw.specs || []).map((s: any) => ({ key: s.key, value: s.value })),
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
    tags: (raw.tags || []).map((t: any) => ({ id: t.id, documentId: t.documentId, name: t.name, slug: t.slug })),
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

export async function getCategories(): Promise<Category[]> {
  const json = await strapiFetch<any>("/api/categories?populate=products");
  return json.data.map((c: any) => ({
    id: c.id,
    documentId: c.documentId,
    updatedAt: c.updatedAt ?? c.publishedAt ?? c.createdAt ?? null,
    name: c.name,
    slug: c.slug,
    description: c.description,
    productCount: Array.isArray(c.products) ? c.products.length : 0,
  }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const json = await strapiFetch<any>(`/api/categories?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=products`);
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
  const json = await strapiFetch<any>(`/api/products?${PRODUCT_POPULATE}&pagination[pageSize]=100`);
  return json.data.map(mapProduct);
}

export async function getProductsByCategorySlug(slug: string): Promise<Product[]> {
  const json = await strapiFetch<any>(
    `/api/products?filters[category][slug][$eq]=${encodeURIComponent(slug)}&${PRODUCT_POPULATE}&pagination[pageSize]=100`
  );
  return json.data.map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const json = await strapiFetch<any>(`/api/products?filters[slug][$eq]=${encodeURIComponent(slug)}&${PRODUCT_POPULATE}`);
  const raw = json.data[0];
  if (!raw) return null;
  return mapProduct(raw);
}

export async function getFaqs(): Promise<Faq[]> {
  const json = await strapiFetch<any>("/api/faqs?sort=order:asc&pagination[pageSize]=100");
  return json.data.map((f: any) => ({ id: f.id, question: f.question, answer: f.answer, order: f.order }));
}

export async function getPolicies(): Promise<Policy[]> {
  const json = await strapiFetch<any>("/api/policies?pagination[pageSize]=100");
  return json.data.map((p: any) => ({
    id: p.id,
    documentId: p.documentId,
    updatedAt: p.updatedAt ?? p.publishedAt ?? p.createdAt ?? null,
    title: p.title,
    slug: p.slug,
    body: p.body,
  }));
}
