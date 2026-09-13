import type { CheckoutResult, CustomerProfile, Order, OrderItemInput } from "./checkout-contracts";
import { CHECKOUT_ERROR_CODES } from "./checkout-contracts";

const REQUEST_TIMEOUT_MS = 10000;

function getBaseUrl(): string {
  const raw = process.env.STRAPI_INTERNAL_URL || process.env.STRAPI_URL;
  if (!raw || !raw.trim()) throw new Error("STRAPI_INTERNAL_URL is not set");
  return raw.trim().replace(/\/+$/, "");
}

function errorResult<T>(error: string, status: number): CheckoutResult<T> {
  return { ok: false, error, status };
}

async function request<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<CheckoutResult<T>> {
  let baseUrl: string;
  try {
    baseUrl = getBaseUrl();
  } catch {
    return errorResult(CHECKOUT_ERROR_CODES.UPSTREAM_ERROR, 500);
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string> | undefined),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return errorResult(CHECKOUT_ERROR_CODES.UPSTREAM_ERROR, 502);
  }

  if (res.status === 401 || res.status === 403) {
    return errorResult(CHECKOUT_ERROR_CODES.UNAUTHENTICATED, 401);
  }
  if (res.status === 404) {
    return errorResult(CHECKOUT_ERROR_CODES.NOT_FOUND, 404);
  }

  let body: { ok?: boolean; data?: T; error?: string } | undefined;
  try {
    body = await res.json();
  } catch {
    return errorResult(CHECKOUT_ERROR_CODES.UPSTREAM_ERROR, 502);
  }

  if (!res.ok || body?.ok === false) {
    const code = typeof body?.error === "string" ? body.error : CHECKOUT_ERROR_CODES.UPSTREAM_ERROR;
    return errorResult(code, res.status >= 400 ? res.status : 502);
  }

  return { ok: true, data: body!.data as T };
}

export async function getProfile(accessToken: string): Promise<CheckoutResult<CustomerProfile | null>> {
  return request<CustomerProfile | null>("/api/customer-profiles/me", accessToken, { method: "GET" });
}

export async function updateProfile(
  accessToken: string,
  profile: CustomerProfile
): Promise<CheckoutResult<CustomerProfile>> {
  return request<CustomerProfile>("/api/customer-profiles/me", accessToken, {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export async function createOrder(
  accessToken: string,
  items: OrderItemInput[]
): Promise<CheckoutResult<Order>> {
  return request<Order>("/api/orders", accessToken, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export async function listOrders(accessToken: string): Promise<CheckoutResult<Order[]>> {
  return request<Order[]>("/api/orders", accessToken, { method: "GET" });
}

export async function getOrder(accessToken: string, reference: string): Promise<CheckoutResult<Order>> {
  return request<Order>(`/api/orders/${encodeURIComponent(reference)}`, accessToken, { method: "GET" });
}
