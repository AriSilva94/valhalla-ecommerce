import { cookies } from "next/headers";
import { resolveSession } from "./auth-session";
import type { AuthUser } from "./auth-contracts";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const accessToken = store.get("valhalla_access")?.value;
  const refreshToken = store.get("valhalla_refresh")?.value;
  if (!accessToken && !refreshToken) return null;

  const result = await resolveSession(accessToken, refreshToken);
  return result.ok ? result.data.user : null;
}
