const AUTH_PATH_PREFIXES = [
  "/entrar",
  "/cadastro",
  "/esqueci-senha",
  "/auth/reset-password",
  "/auth/email-confirmed",
];

export function isAuthRoute(pathname: string): boolean {
  return AUTH_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
