export type AuthUser = {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  role: string;
};

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',
  INVALID_ORIGIN: 'INVALID_ORIGIN',
  RATE_LIMITED: 'RATE_LIMITED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
