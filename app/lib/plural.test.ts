import test from "node:test";
import assert from "node:assert/strict";
import { plural } from "./plural";

test("plural: só 1 usa singular", () => {
  assert.equal(plural(1, "produto"), "1 produto");
  assert.equal(plural(2, "produto"), "2 produtos");
});

test("plural: zero é plural em pt-BR", () => {
  assert.equal(plural(0, "produto"), "0 produtos");
});

test("plural: aceita plural irregular", () => {
  assert.equal(plural(1, "resultado", "resultados"), "1 resultado");
  assert.equal(plural(3, "resultado", "resultados"), "3 resultados");
});

test("plural: -1 usa singular", () => {
  assert.equal(plural(-1, "produto"), "-1 produto");
});
