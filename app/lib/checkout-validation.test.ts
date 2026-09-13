import test from "node:test";
import assert from "node:assert/strict";
import { onlyDigits, isValidCpfCnpj, isValidCep, isValidUf } from "./checkout-validation";

test("onlyDigits remove tudo que não é dígito", () => {
  assert.equal(onlyDigits("123.456.789-09"), "12345678909");
});

test("isValidCpfCnpj aceita CPF válido", () => {
  assert.equal(isValidCpfCnpj("11144477735"), true);
});

test("isValidCpfCnpj rejeita CPF com dígito errado", () => {
  assert.equal(isValidCpfCnpj("11144477736"), false);
});

test("isValidCpfCnpj aceita CNPJ válido", () => {
  assert.equal(isValidCpfCnpj("11222333000181"), true);
});

test("isValidCpfCnpj rejeita comprimento inválido", () => {
  assert.equal(isValidCpfCnpj("123"), false);
});

test("isValidCep aceita 8 dígitos", () => {
  assert.equal(isValidCep("01310100"), true);
});

test("isValidCep rejeita comprimento diferente de 8", () => {
  assert.equal(isValidCep("123"), false);
});

test("isValidUf aceita UF maiúscula válida", () => {
  assert.equal(isValidUf("SP"), true);
});

test("isValidUf rejeita UF inexistente ou minúscula", () => {
  assert.equal(isValidUf("XX"), false);
  assert.equal(isValidUf("sp"), false);
});
