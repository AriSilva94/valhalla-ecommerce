import type { NextConfig } from "next";

// Product media is served by the storage bucket, not by Strapi, so next/image
// needs the host allow-listed. Kept in an env var because the bucket moves
// from the r2.dev subdomain to a custom domain later.
const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST;

const nextConfig: NextConfig = {
  // Emit a minimal standalone server for Docker deploy
  output: "standalone",
  images: {
    remotePatterns: mediaHost
      ? [{ protocol: "https", hostname: mediaHost, pathname: "/**" }]
      : [],
  },
};

export default nextConfig;
