import { notFound } from "next/navigation";
import { getCategoryBySlug, getProductsByCategorySlug, getSiteSettings } from "../../lib/strapi";
import CategoryListingClient from "../../components/CategoryListingClient";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [products, settings] = await Promise.all([getProductsByCategorySlug(slug), getSiteSettings()]);

  return (
    <CategoryListingClient
      products={products}
      crumb={[{ label: "Categorias", href: "/categorias" }, { label: category.name }]}
      title={category.name}
      emptyTitle="Categoria em breve"
      emptyDesc="Estamos preparando novidades para esta categoria. Enquanto isso, veja os destaques ou fale com a gente."
      whatsappNumber={settings.whatsappNumber}
    />
  );
}
