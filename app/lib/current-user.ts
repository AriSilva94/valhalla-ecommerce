import { cookies } from "next/headers";
import { resolveSession } from "./auth-session";
import type { AuthUser } from "./auth-contracts";

// Best-effort session read for server-rendered UI (e.g. the Header's
// "Entrar" vs. logged-in state). If the access token is expired but the
// refresh token is valid, resolveSession issues fresh tokens for this one
// read — but a Server Component cannot set cookies, so that rotation isn't
// persisted here. The next request that hits an actual route handler
// (/api/auth/session, or any auth route) performs the real rotation and
// writes the cookies. Worst case this helper is one request behind, never
// wrong about who is logged in.
export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const accessToken = store.get("valhalla_access")?.value;
  const refreshToken = store.get("valhalla_refresh")?.value;
  if (!accessToken && !refreshToken) return null;

  const result = await resolveSession(accessToken, refreshToken);
  return result.ok ? result.data.user : null;
}
