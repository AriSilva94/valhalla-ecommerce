import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getProductsByCategorySlug, getSiteSettings } from "../../lib/strapi";
import { sortSoldOutLast } from "../../lib/product-availability";
import { stripMarkdown } from "../../lib/markdown";
import ProductDetailClient from "../../components/ProductDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.seo?.metaTitle ?? product.name,
    description: product.seo?.metaDescription ?? stripMarkdown(product.description),
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [categoryProducts, settings] = await Promise.all([
    product.category ? getProductsByCategorySlug(product.category.slug) : Promise.resolve([]),
    getSiteSettings(),
  ]);
  const related = sortSoldOutLast(categoryProducts.filter((p) => p.slug !== product.slug)).slice(0, 4);

  return <ProductDetailClient product={product} related={related} whatsappNumber={settings.whatsappNumber} />;
}
