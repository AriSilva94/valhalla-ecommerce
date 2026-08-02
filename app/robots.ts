import type { MetadataRoute } from "next";
import { getCanonicalPath, getSiteUrl, isProductionIndexable } from "./lib/site-url";

export default function robots(): MetadataRoute.Robots {
  if (!isProductionIndexable()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: getCanonicalPath("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
