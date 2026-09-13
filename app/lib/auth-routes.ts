const AUTH_PATH_PREFIXES = [
  "/entrar",
  "/cadastro",
  "/esqueci-senha",
  "/auth/reset-password",
  "/auth/email-confirmed",
];

// The auth flow's split-screen layout (AuthShell) replaces the usual page
// chrome, so Header and Footer trim themselves down on these routes instead
// of showing category nav / institutional links that have nothing to do
// with signing in.
export function isAuthRoute(pathname: string): boolean {
  return AUTH_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
