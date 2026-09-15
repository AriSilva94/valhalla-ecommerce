import { CHECKOUT_ERROR_CODES } from "./checkout-contracts";

type GenerateKey = () => string;

function shouldRetainCheckoutIdempotencyKey(status: number, error?: string): boolean {
  return status === 409 || status === 429 || status >= 500 || error === CHECKOUT_ERROR_CODES.UPSTREAM_ERROR;
}

export function createCheckoutIdempotencyKeyManager(generateKey: GenerateKey = () => crypto.randomUUID()) {
  let key: string | null = null;

  return {
    get(): string {
      key ??= generateKey();
      return key;
    },
    complete(status: number, error?: string): void {
      if (!shouldRetainCheckoutIdempotencyKey(status, error)) key = null;
    },
  };
}
