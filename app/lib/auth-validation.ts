import type { AuthResult } from './auth-contracts';
import { AUTH_ERROR_CODES } from './auth-contracts';

export async function parseJsonBody(
  request: Request,
  maxBytes = 16384
): Promise<AuthResult<unknown>> {
  const text = await request.text();
  // Byte length, not character length — a body full of multi-byte UTF-8
  // characters could stay under a character-count cap while exceeding it.
  const byteLength = Buffer.byteLength(text, 'utf8');
  if (byteLength > maxBytes) {
    return { ok: false, error: AUTH_ERROR_CODES.VALIDATION_ERROR, status: 413 };
  }

  try {
    const data = text.length === 0 ? {} : JSON.parse(text);
    return { ok: true, data };
  } catch {
    return { ok: false, error: AUTH_ERROR_CODES.VALIDATION_ERROR, status: 400 };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value);
}

// Minimum 8 characters — matches the backend's default users-permissions
// password rule, so the BFF rejects obviously-too-short passwords before
// spending a round trip to Strapi.
export function isValidPassword(value: string): boolean {
  return typeof value === 'string' && value.length >= 8;
}
