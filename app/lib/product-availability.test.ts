import test from "node:test";
import assert from "node:assert/strict";
import { isSoldOut, sortSoldOutLast } from "./product-availability";
import type { Product, ProductVariant } from "./strapi";

function variant(available: boolean, price = 100): ProductVariant {
  return {
    id: 1,
    sku: "SKU",
    color: { name: "AZUL", hex: "#1E90FF" },
    configLabel: "16GB",
    price,
    compareAtPrice: null,
    available,
  };
}

function product(slug: string, variants: ProductVariant[]): Product {
  return {
    id: 1,
    documentId: "doc-" + slug,
    updatedAt: null,
    name: slug,
    slug,
    basePrice: 100,
    variantGroupLabel: null,
    specs: [],
    description: "",
    warranty: "",
    brand: null,
    category: null,
    tags: [],
    variants,
    seo: null,
    mainImage: null,
    gallery: [],
  };
}

const slugs = (list: Product[]) => list.map((p) => p.slug);

test("isSoldOut: todas as variantes indisponíveis -> esgotado", () => {
  assert.equal(isSoldOut(product("a", [variant(false), variant(false)])), true);
});

test("isSoldOut: uma variante disponível basta -> não esgotado", () => {
  assert.equal(isSoldOut(product("a", [variant(false), variant(true)])), false);
});

test("isSoldOut: produto sem variante cadastrada não é tratado como esgotado", () => {
  assert.equal(isSoldOut(product("a", [])), false);
});

test("sortSoldOutLast: esgotados vão pro fim", () => {
  const list = [
    product("esgotado-1", [variant(false)]),
    product("disponivel-1", [variant(true)]),
    product("esgotado-2", [variant(false)]),
    product("disponivel-2", [variant(true)]),
  ];
  assert.deepEqual(slugs(sortSoldOutLast(list)), [
    "disponivel-1",
    "disponivel-2",
    "esgotado-1",
    "esgotado-2",
  ]);
});

test("sortSoldOutLast: sem comparator, preserva a ordem do Strapi dentro de cada grupo", () => {
  const list = [
    product("c", [variant(true)]),
    product("a", [variant(false)]),
    product("b", [variant(true)]),
  ];
  assert.deepEqual(slugs(sortSoldOutLast(list)), ["c", "b", "a"]);
});

test("sortSoldOutLast: com comparator, esgotado barato continua no fim", () => {
  const byPriceAsc = (a: Product, b: Product) => a.variants[0].price - b.variants[0].price;
  const list = [
    product("disponivel-caro", [variant(true, 900)]),
    product("esgotado-barato", [variant(false, 10)]),
    product("disponivel-barato", [variant(true, 100)]),
    product("esgotado-caro", [variant(false, 800)]),
  ];
  assert.deepEqual(slugs(sortSoldOutLast(list, byPriceAsc)), [
    "disponivel-barato",
    "disponivel-caro",
    "esgotado-barato",
    "esgotado-caro",
  ]);
});

test("sortSoldOutLast: não muta a lista recebida", () => {
  const list = [product("esgotado", [variant(false)]), product("disponivel", [variant(true)])];
  sortSoldOutLast(list);
  assert.deepEqual(slugs(list), ["esgotado", "disponivel"]);
});

test("sortSoldOutLast: lista vazia e lista toda esgotada", () => {
  assert.deepEqual(sortSoldOutLast([]), []);
  const todosEsgotados = [product("a", [variant(false)]), product("b", [variant(false)])];
  assert.deepEqual(slugs(sortSoldOutLast(todosEsgotados)), ["a", "b"]);
});
