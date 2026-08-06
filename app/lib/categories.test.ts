import test from "node:test";
import assert from "node:assert/strict";
import { visibleCategories } from "./categories";
import type { Category } from "./strapi";

function category(slug: string, productCount: number): Category {
  return {
    id: 1,
    documentId: "doc-" + slug,
    updatedAt: null,
    name: slug,
    slug,
    description: "",
    productCount,
  };
}

test("visibleCategories: esconde categoria sem produto vinculado", () => {
  const list = [category("gabinetes", 5), category("armazenamento", 0), category("tintas", 2)];
  assert.deepEqual(
    visibleCategories(list).map((c) => c.slug),
    ["gabinetes", "tintas"],
  );
});

test("visibleCategories: uma unidade já basta para aparecer", () => {
  assert.deepEqual(
    visibleCategories([category("armazenamento", 1)]).map((c) => c.slug),
    ["armazenamento"],
  );
});

test("visibleCategories: preserva a ordem original", () => {
  const list = [category("c", 1), category("vazia", 0), category("a", 3), category("b", 2)];
  assert.deepEqual(
    visibleCategories(list).map((c) => c.slug),
    ["c", "a", "b"],
  );
});

test("visibleCategories: não muta a lista recebida", () => {
  const list = [category("gabinetes", 5), category("armazenamento", 0)];
  visibleCategories(list);
  assert.equal(list.length, 2);
});

test("visibleCategories: lista vazia e lista toda sem produto", () => {
  assert.deepEqual(visibleCategories([]), []);
  assert.deepEqual(visibleCategories([category("a", 0), category("b", 0)]), []);
});
