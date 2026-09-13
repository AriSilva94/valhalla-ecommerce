export type OrderItemInput = { productSlug: string; variantSku: string; qty: number };

export type OrderItem = {
  productSlug: string;
  productName: string;
  variantSku: string;
  colorName: string;
  configLabel: string;
  unitPrice: number;
  qty: number;
  // Not part of the immutable snapshot Strapi stores — the BFF's
  // /api/orders/[id] route attaches the product's *current* image
  // cosmetically. Absent on list responses and null when the lookup fails
  // or the product has no image.
  productImageUrl?: string | null;
};

export type OrderStatus = "pending" | "paid" | "expired" | "cancelled" | "failed";

export type Order = {
  id: number;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  asaasInvoiceUrl: string | null;
  pixQrCodeImage: string | null;
  pixCopyPaste: string | null;
  pixExpiration: string | null;
  createdAt: string;
};

export type CustomerProfile = {
  cpfCnpj: string;
  phone: string;
  addressLine: string;
  addressNumber: string;
  addressComplement: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
};

export type CheckoutResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

export const CHECKOUT_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PROFILE_INCOMPLETE: "PROFILE_INCOMPLETE",
  EMPTY_CART: "EMPTY_CART",
  INVALID_ITEM: "INVALID_ITEM",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  VARIANT_NOT_FOUND: "VARIANT_NOT_FOUND",
  VARIANT_UNAVAILABLE: "VARIANT_UNAVAILABLE",
  UPSTREAM_ERROR: "UPSTREAM_ERROR",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  INVALID_ORIGIN: "INVALID_ORIGIN",
  RATE_LIMITED: "RATE_LIMITED",
  NOT_FOUND: "NOT_FOUND",
} as const;

export type CheckoutErrorCode = (typeof CHECKOUT_ERROR_CODES)[keyof typeof CHECKOUT_ERROR_CODES];
