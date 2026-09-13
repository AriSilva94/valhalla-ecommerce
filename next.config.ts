import type { NextConfig } from "next";

const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST;

const nextConfig: NextConfig = {
  output: "standalone",
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 20,
  },
  images: {
    remotePatterns: mediaHost
      ? [{ protocol: "https", hostname: mediaHost, pathname: "/**" }]
      : [],
    qualities: [75, 90],
  },
};

export default nextConfig;
