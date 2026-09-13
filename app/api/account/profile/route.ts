import { readAuthCookies, jsonError, jsonNoStore, jsonWithCookies } from "../../auth/_shared";
import { resolveSession } from "../../../lib/auth-session";
import { buildAuthCookieInstructions } from "../../../lib/auth-cookies";
import * as checkoutClient from "../../../lib/checkout-strapi-client";
import { CHECKOUT_ERROR_CODES } from "../../../lib/checkout-contracts";
import { isValidCep, isValidCpfCnpj, isValidUf, onlyDigits } from "../../../lib/checkout-validation";

export async function GET(request: Request): Promise<Response> {
  const { accessToken, refreshToken } = readAuthCookies(request);
  const session = await resolveSession(accessToken, refreshToken);
  if (!session.ok) return jsonError(session.error, session.status);

  const secure = process.env.AUTH_COOKIE_SECURE !== "false";
  const tokenToUse =
    session.data.refreshed && session.data.newTokens ? session.data.newTokens.accessToken : accessToken!;

  const result = await checkoutClient.getProfile(tokenToUse);

  if (session.data.refreshed && session.data.newTokens) {
    const cookieInstructions = buildAuthCookieInstructions(session.data.newTokens, secure);
    if (!result.ok) {
      return jsonWithCookies({ ok: false, error: result.error }, result.status, cookieInstructions);
    }
    return jsonWithCookies({ ok: true, data: result.data }, 200, cookieInstructions);
  }

  if (!result.ok) return jsonError(result.error, result.status);
  return jsonNoStore({ ok: true, data: result.data });
}

export async function PUT(request: Request): Promise<Response> {
  const { accessToken, refreshToken } = readAuthCookies(request);
  const session = await resolveSession(accessToken, refreshToken);
  if (!session.ok) return jsonError(session.error, session.status);

  const secure = process.env.AUTH_COOKIE_SECURE !== "false";
  const tokenToUse =
    session.data.refreshed && session.data.newTokens ? session.data.newTokens.accessToken : accessToken!;

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
    if (session.data.refreshed && session.data.newTokens) {
      const cookieInstructions = buildAuthCookieInstructions(session.data.newTokens, secure);
      return jsonWithCookies({ ok: false, error: CHECKOUT_ERROR_CODES.VALIDATION_ERROR }, 400, cookieInstructions);
    }
    return jsonError(CHECKOUT_ERROR_CODES.VALIDATION_ERROR, 400);
  }

  const result = await checkoutClient.updateProfile(tokenToUse, profile);

  if (session.data.refreshed && session.data.newTokens) {
    const cookieInstructions = buildAuthCookieInstructions(session.data.newTokens, secure);
    if (!result.ok) {
      return jsonWithCookies({ ok: false, error: result.error }, result.status, cookieInstructions);
    }
    return jsonWithCookies({ ok: true, data: result.data }, 200, cookieInstructions);
  }

  if (!result.ok) return jsonError(result.error, result.status);
  return jsonNoStore({ ok: true, data: result.data });
}
