export interface CartLine {
  key: string;
  productSlug: string;
  productName: string;
  productImageUrl: string | null;
  productImageAlt: string | null;
  variantSku: string;
  colorName: string;
  configLabel: string;
  unitPrice: number;
  qty: number;
}

export type NewCartLine = Omit<CartLine, "key" | "qty">;

export const STORAGE_KEY = "valhalla:cart";
export const MIN_QTY = 1;
export const MAX_QTY = 10;

const EMPTY: CartLine[] = [];

export function lineKey(line: NewCartLine): string {
  return line.productSlug + "|" + line.variantSku;
}

export function clampQty(qty: number): number {
  return Math.max(MIN_QTY, Math.min(MAX_QTY, qty));
}


export function addLine(cart: CartLine[], line: NewCartLine, qty: number): CartLine[] {
  const key = lineKey(line);
  const next = cart.map((x) => ({ ...x }));
  const existing = next.find((x) => x.key === key);
  if (existing) existing.qty += qty;
  else next.push({ ...line, key, qty });
  return next;
}

export function setQty(cart: CartLine[], key: string, qty: number): CartLine[] {
  return cart.map((x) => (x.key === key ? { ...x, qty: clampQty(qty) } : x));
}

export function removeLine(cart: CartLine[], key: string): CartLine[] {
  return cart.filter((x) => x.key !== key);
}

export function parseCart(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const lines = parsed.filter(isCartLine);
    return lines.length > 0 ? lines : EMPTY;
  } catch {
    // ignore malformed localStorage content
    return EMPTY;
  }
}

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const l = value as Record<string, unknown>;
  return (
    typeof l.key === "string" &&
    typeof l.productSlug === "string" &&
    typeof l.productName === "string" &&
    (l.productImageUrl === undefined || l.productImageUrl === null || typeof l.productImageUrl === "string") &&
    (l.productImageAlt === undefined || l.productImageAlt === null || typeof l.productImageAlt === "string") &&
    typeof l.variantSku === "string" &&
    typeof l.colorName === "string" &&
    typeof l.configLabel === "string" &&
    typeof l.unitPrice === "number" &&
    Number.isFinite(l.unitPrice) &&
    typeof l.qty === "number" &&
    Number.isFinite(l.qty)
  );
}


const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedCart: CartLine[] = EMPTY;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeRaw(cart: CartLine[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
  }
}

export function getCartSnapshot(): CartLine[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedCart = parseCart(raw);
  }
  return cachedCart;
}

export function getServerCartSnapshot(): CartLine[] {
  return EMPTY;
}

export function subscribeToCart(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function updateCart(reducer: (cart: CartLine[]) => CartLine[]): void {
  const next = reducer(getCartSnapshot());
  cachedCart = next;
  cachedRaw = JSON.stringify(next);
  writeRaw(next);
  for (const listener of listeners) listener();
}

export function cartCount(cart: CartLine[]): number {
  return cart.reduce((a, x) => a + x.qty, 0);
}

export function cartTotal(cart: CartLine[]): number {
  return cart.reduce((a, x) => a + x.unitPrice * x.qty, 0);
}

export function resetCartCacheForTests(): void {
  cachedRaw = null;
  cachedCart = EMPTY;
}
