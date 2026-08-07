import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  STORAGE_KEY,
  addLine,
  cartCount,
  cartTotal,
  getCartSnapshot,
  getServerCartSnapshot,
  parseCart,
  removeLine,
  resetCartCacheForTests,
  setQty,
  subscribeToCart,
  updateCart,
  type CartLine,
  type NewCartLine,
} from "./cart-store";

const line: NewCartLine = {
  productSlug: "notebook-x",
  productName: "Notebook X",
  productImageUrl: "https://example.com/notebook-x.jpg",
  productImageAlt: "Notebook X",
  variantSku: "NBX-AZUL-16",
  colorName: "AZUL",
  configLabel: "16GB",
  unitPrice: 100,
};

function fakeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
}

beforeEach(() => {
  resetCartCacheForTests();
  (globalThis as { localStorage?: Storage }).localStorage = fakeStorage();
  (globalThis as { window?: unknown }).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
});

test("addLine: soma a quantidade quando a mesma variante volta", () => {
  const once = addLine([], line, 2);
  assert.equal(once.length, 1);
  assert.equal(once[0].key, "notebook-x|NBX-AZUL-16");
  assert.equal(once[0].qty, 2);

  const twice = addLine(once, line, 3);
  assert.equal(twice.length, 1);
  assert.equal(twice[0].qty, 5);
  assert.equal(once[0].qty, 2, "não muta o array anterior");
});

test("addLine: variante diferente do mesmo produto vira linha nova", () => {
  const cart = addLine(addLine([], line, 1), { ...line, variantSku: "NBX-AZUL-32" }, 1);
  assert.equal(cart.length, 2);
});

test("setQty: limita entre 1 e 10", () => {
  const cart = addLine([], line, 1);
  assert.equal(setQty(cart, cart[0].key, 0)[0].qty, 1);
  assert.equal(setQty(cart, cart[0].key, 99)[0].qty, 10);
  assert.equal(setQty(cart, cart[0].key, 4)[0].qty, 4);
});

test("removeLine: tira só a chave pedida", () => {
  const cart = addLine(addLine([], line, 1), { ...line, variantSku: "OUTRO" }, 1);
  const left = removeLine(cart, "notebook-x|OUTRO");
  assert.deepEqual(
    left.map((l) => l.key),
    ["notebook-x|NBX-AZUL-16"],
  );
});

test("parseCart: descarta storage inválido em vez de quebrar", () => {
  assert.deepEqual(parseCart(null), []);
  assert.deepEqual(parseCart(""), []);
  assert.deepEqual(parseCart("{ isso não é json"), []);
  assert.deepEqual(parseCart('{"key":"x"}'), [], "objeto não é lista");
  assert.deepEqual(parseCart('[{"key":"x"}]'), [], "linha incompleta é descartada");
  assert.deepEqual(parseCart('[{"unitPrice":"cem"}]'), []);
});

test("parseCart: aceita linha completa", () => {
  const stored: CartLine[] = [{ ...line, key: "notebook-x|NBX-AZUL-16", qty: 2 }];
  assert.deepEqual(parseCart(JSON.stringify(stored)), stored);
});

test("getCartSnapshot: lê o storage e mantém a mesma referência sem mudança", () => {
  assert.deepEqual(getCartSnapshot(), []);
  const first = getCartSnapshot();
  assert.equal(getCartSnapshot(), first, "referência estável evita loop de render");

  updateCart((c) => addLine(c, line, 2));
  const after = getCartSnapshot();
  assert.equal(after.length, 1);
  assert.equal(after[0].qty, 2);
  assert.equal(getCartSnapshot(), after);
});

test("updateCart: persiste no storage e avisa os inscritos", () => {
  let notified = 0;
  const unsubscribe = subscribeToCart(() => notified++);

  updateCart((c) => addLine(c, line, 1));
  assert.equal(notified, 1);
  assert.deepEqual(parseCart(localStorage.getItem(STORAGE_KEY)), getCartSnapshot());

  unsubscribe();
  updateCart((c) => addLine(c, line, 1));
  assert.equal(notified, 1, "não avisa depois de cancelar a inscrição");
});

test("getCartSnapshot: relê quando outra aba grava no storage", () => {
  const stored: CartLine[] = [{ ...line, key: "notebook-x|NBX-AZUL-16", qty: 7 }];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  assert.deepEqual(getCartSnapshot(), stored);
});

test("getServerCartSnapshot: carrinho vazio no render do servidor", () => {
  assert.deepEqual(getServerCartSnapshot(), []);
});

test("cartCount/cartTotal: somam quantidade e valor", () => {
  const cart = addLine(addLine([], line, 2), { ...line, variantSku: "OUTRO", unitPrice: 50 }, 3);
  assert.equal(cartCount(cart), 5);
  assert.equal(cartTotal(cart), 2 * 100 + 3 * 50);
});
