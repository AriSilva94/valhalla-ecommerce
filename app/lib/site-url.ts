type SiteEnv = Record<string, string | undefined>;

const FALLBACK_SITE_URL = "https://example.com";

export function getSiteUrl(env: SiteEnv = process.env): string {
  const rawUrl = env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!rawUrl) return FALLBACK_SITE_URL;

  try {
    const url = new URL(rawUrl);

    if (url.protocol !== "https:") return FALLBACK_SITE_URL;

    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function getCanonicalPath(path: string, env: SiteEnv = process.env): string {
  const siteUrl = getSiteUrl(env);
  const normalizedPath = path === "/" ? "" : `/${path.replace(/^\/+/, "")}`;

  return `${siteUrl}${normalizedPath}`;
}

export function isProductionIndexable(env: SiteEnv = process.env): boolean {
  const appEnv = env.NEXT_PUBLIC_APP_ENV?.toLowerCase();
  const vercelEnv = env.VERCEL_ENV?.toLowerCase();

  if (env.NODE_ENV !== "production") return false;
  if (vercelEnv && vercelEnv !== "production") return false;
  if (appEnv && ["development", "dev", "preview", "staging", "homolog", "homologation"].includes(appEnv)) return false;

  return true;
}
