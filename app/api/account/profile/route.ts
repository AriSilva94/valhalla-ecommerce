import { readAuthCookies, jsonError, jsonNoStore } from "../../auth/_shared";
import { resolveSession } from "../../../lib/auth-session";
import * as checkoutClient from "../../../lib/checkout-strapi-client";
import { CHECKOUT_ERROR_CODES } from "../../../lib/checkout-contracts";
import { isValidCep, isValidCpfCnpj, isValidUf, onlyDigits } from "../../../lib/checkout-validation";

export async function GET(request: Request): Promise<Response> {
  const { accessToken, refreshToken } = readAuthCookies(request);
  const session = await resolveSession(accessToken, refreshToken);
  if (!session.ok) return jsonError(session.error, session.status);

  const result = await checkoutClient.getProfile(accessToken!);
  if (!result.ok) return jsonError(result.error, result.status);
  return jsonNoStore({ ok: true, data: result.data });
}

export async function PUT(request: Request): Promise<Response> {
  const { accessToken, refreshToken } = readAuthCookies(request);
  const session = await resolveSession(accessToken, refreshToken);
  if (!session.ok) return jsonError(session.error, session.status);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError(CHECKOUT_ERROR_CODES.VALIDATION_ERROR, 400);
  }

  const profile = {
    cpfCnpj: onlyDigits(typeof body.cpfCnpj === "string" ? body.cpfCnpj : ""),
    phone: onlyDigits(typeof body.phone === "string" ? body.phone : ""),
    addressLine: typeof body.addressLine === "string" ? body.addressLine.trim() : "",
    addressNumber: typeof body.addressNumber === "string" ? body.addressNumber.trim() : "",
    addressComplement: typeof body.addressComplement === "string" ? body.addressComplement.trim() : "",
    neighborhood: typeof body.neighborhood === "string" ? body.neighborhood.trim() : "",
    city: typeof body.city === "string" ? body.city.trim() : "",
    state: typeof body.state === "string" ? body.state.trim().toUpperCase() : "",
    postalCode: onlyDigits(typeof body.postalCode === "string" ? body.postalCode : ""),
  };

  if (
    !isValidCpfCnpj(profile.cpfCnpj) ||
    !isValidCep(profile.postalCode) ||
    !isValidUf(profile.state) ||
    !profile.addressLine ||
    !profile.addressNumber ||
    !profile.neighborhood ||
    !profile.city
  ) {
    return jsonError(CHECKOUT_ERROR_CODES.VALIDATION_ERROR, 400);
  }

  const result = await checkoutClient.updateProfile(accessToken!, profile);
  if (!result.ok) return jsonError(result.error, result.status);
  return jsonNoStore({ ok: true, data: result.data });
}
