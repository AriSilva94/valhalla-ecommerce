import { getHomepage, getProducts, getCategories } from "./lib/strapi";
import { sortSoldOutLast } from "./lib/product-availability";
import HomeInteractive from "./components/HomeInteractive";

export default async function Home() {
  const [homepage, products, categories] = await Promise.all([getHomepage(), getProducts(), getCategories()]);

  const featured = sortSoldOutLast(products).slice(0, 8);
  const offers = sortSoldOutLast(products.filter((p) => p.variants[0]?.compareAtPrice)).slice(0, 4);
  const launches = sortSoldOutLast(products.filter((p) => p.tags.some((t) => t.slug === "novo"))).slice(0, 4);

  return (
    <HomeInteractive
      homepage={homepage}
      categories={categories}
      featured={featured}
      offers={offers}
      launches={launches}
    />
  );
}
