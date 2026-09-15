import test from "node:test";
import assert from "node:assert/strict";
import { CHECKOUT_ERROR_CODES } from "./checkout-contracts";
import { createCheckoutIdempotencyKeyManager } from "./checkout-idempotency";

test("reutiliza a chave após resposta 502 UPSTREAM_ERROR", () => {
  const manager = createCheckoutIdempotencyKeyManager(() => "first-key");

  const firstAttemptKey = manager.get();
  manager.complete(502, CHECKOUT_ERROR_CODES.UPSTREAM_ERROR);
  const retryKey = manager.get();

  assert.equal(retryKey, firstAttemptKey);
});

test("reutiliza a chave após resposta 409", () => {
  const manager = createCheckoutIdempotencyKeyManager(() => "first-key");

  const firstAttemptKey = manager.get();
  manager.complete(409, "ORDER_IN_PROGRESS");

  assert.equal(manager.get(), firstAttemptKey);
});

test("reutiliza a chave após resposta 429", () => {
  const manager = createCheckoutIdempotencyKeyManager(() => "first-key");

  const firstAttemptKey = manager.get();
  manager.complete(429, CHECKOUT_ERROR_CODES.RATE_LIMITED);

  assert.equal(manager.get(), firstAttemptKey);
});

test("libera a chave após sucesso ou erro definitivamente não repetível", () => {
  const generatedKeys = ["first-key", "second-key", "third-key"];
  const manager = createCheckoutIdempotencyKeyManager(() => generatedKeys.shift()!);

  assert.equal(manager.get(), "first-key");
  manager.complete(201);
  assert.equal(manager.get(), "second-key");
  manager.complete(400, CHECKOUT_ERROR_CODES.VALIDATION_ERROR);
  assert.equal(manager.get(), "third-key");
  manager.complete(401, CHECKOUT_ERROR_CODES.UNAUTHENTICATED);
});
