import test from "node:test";
import assert from "node:assert/strict";
import { fmt, formatVariantMeta, waUrl } from "./wa";

test("fmt: sempre exibe duas casas decimais", () => {
  assert.equal(fmt(17), "R$ 17,00");
  assert.equal(fmt(17.5), "R$ 17,50");
  assert.equal(fmt(17.05), "R$ 17,05");
  assert.equal(fmt(0), "R$ 0,00");
});

test("fmt: mantém o separador de milhar do pt-BR", () => {
  assert.equal(fmt(1234), "R$ 1.234,00");
  assert.equal(fmt(1234.5), "R$ 1.234,50");
});

test("fmt: arredonda o que passa de duas casas", () => {
  assert.equal(fmt(17.055), "R$ 17,06");
  assert.equal(fmt(17.004), "R$ 17,00");
});

test("waUrl: monta o link do WhatsApp só com dígitos e a mensagem escapada", () => {
  assert.equal(
    waUrl("+55 (11) 99999-9999", "Olá, tudo bem?"),
    "https://wa.me/5511999999999?text=Ol%C3%A1%2C%20tudo%20bem%3F"
  );
});

test("formatVariantMeta: junta config e cor quando ambos existem", () => {
  assert.equal(formatVariantMeta("128GB", "Preto"), "128GB · Preto");
});

test("formatVariantMeta: omite o separador quando a cor está vazia", () => {
  assert.equal(formatVariantMeta("Padrão", ""), "Padrão");
});

test("formatVariantMeta: omite o separador quando o config está vazio", () => {
  assert.equal(formatVariantMeta("", "Azul"), "Azul");
});

test("formatVariantMeta: retorna string vazia quando os dois estão vazios", () => {
  assert.equal(formatVariantMeta("", ""), "");
});
