import type { Product } from "./strapi";

export function isSoldOut(p: Product): boolean {
  return p.variants.length > 0 && p.variants.every((v) => !v.available);
}

export function sortSoldOutLast(
  products: Product[],
  compare?: (a: Product, b: Product) => number,
): Product[] {
  const available: Product[] = [];
  const soldOut: Product[] = [];
  for (const p of products) {
    (isSoldOut(p) ? soldOut : available).push(p);
  }
  if (compare) {
    available.sort(compare);
    soldOut.sort(compare);
  }
  return [...available, ...soldOut];
}
