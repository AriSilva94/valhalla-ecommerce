import type { MetadataRoute } from "next";
import { getCategories, getProducts, getSiteSettings } from "./lib/strapi";
import { getCanonicalPath } from "./lib/site-url";

type SitemapEntry = MetadataRoute.Sitemap[number];

function toDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function staticRoute(path: string, priority: number, changeFrequency: SitemapEntry["changeFrequency"], lastModified?: string | null): SitemapEntry {
  return {
    url: getCanonicalPath(path),
    lastModified: toDate(lastModified),
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, categories, products] = await Promise.all([getSiteSettings(), getCategories(), getProducts()]);

  return [
    staticRoute("/", 1, "weekly", settings.updatedAt),
    staticRoute("/categorias", 0.8, "weekly", settings.updatedAt),
    staticRoute("/sobre", 0.6, "monthly", settings.updatedAt),
    staticRoute("/contato", 0.6, "monthly", settings.updatedAt),
    staticRoute("/faq", 0.5, "monthly", settings.updatedAt),
    staticRoute("/politicas", 0.4, "yearly", settings.updatedAt),
    ...categories.map((category) => ({
      url: getCanonicalPath(`/categoria/${category.slug}`),
      lastModified: toDate(category.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: getCanonicalPath(`/produto/${product.slug}`),
      lastModified: toDate(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: product.mainImage?.url ? [product.mainImage.url] : undefined,
    })),
  ];
}
