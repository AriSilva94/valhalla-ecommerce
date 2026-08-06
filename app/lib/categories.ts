import type { Category } from "./strapi";

export function visibleCategories(categories: Category[]): Category[] {
  return categories.filter((c) => c.productCount > 0);
}
