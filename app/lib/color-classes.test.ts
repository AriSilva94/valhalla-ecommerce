import test from "node:test";
import assert from "node:assert/strict";
import { bgClass, swatchStyle } from "./color-classes";

test("bgClass: resolve os tokens do design system", () => {
  assert.equal(bgClass("#8CFF00"), "bg-vh-lime");
  assert.equal(bgClass("transparent"), "bg-transparent");
});

test("swatchStyle: usa o hex do CMS, não o fallback preto do allowlist", () => {
  assert.deepEqual(swatchStyle("#1E90FF"), { backgroundColor: "#1E90FF" });
  assert.deepEqual(swatchStyle("#1e90ff"), { backgroundColor: "#1e90ff" });
  assert.deepEqual(swatchStyle("#abc"), { backgroundColor: "#abc" });
});

test("swatchStyle: hex sem # é normalizado", () => {
  assert.deepEqual(swatchStyle("1E90FF"), { backgroundColor: "#1E90FF" });
});

test("swatchStyle: valor inválido ou vazio cai em cinza neutro, não em preto", () => {
  assert.deepEqual(swatchStyle(""), { backgroundColor: "#9690A3" });
  assert.deepEqual(swatchStyle("AZUL"), { backgroundColor: "#9690A3" });
  assert.deepEqual(swatchStyle("#12345"), { backgroundColor: "#9690A3" });
  assert.deepEqual(swatchStyle("url(javascript:alert(1))"), { backgroundColor: "#9690A3" });
});
