import { getProducts, getSiteSettings } from "../lib/strapi";
import CategoryListingClient from "../components/CategoryListingClient";

export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q || "").trim().toLowerCase();

  const [allProducts, settings] = await Promise.all([getProducts(), getSiteSettings()]);
  const results = query
    ? allProducts.filter((p) => (p.name + " " + (p.brand?.name ?? "") + " " + (p.category?.name ?? "")).toLowerCase().includes(query))
    : [];

  return (
    <CategoryListingClient
      products={results}
      crumb="Busca"
      title={`Resultados para "${q || ""}"`}
      emptyTitle="Nenhum resultado encontrado"
      emptyDesc="Tente outra palavra, confira a ortografia ou fale direto com nosso atendente."
      whatsappNumber={settings.whatsappNumber}
    />
  );
}
