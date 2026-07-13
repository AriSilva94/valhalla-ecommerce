import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a minimal standalone server for Docker deploy
  output: "standalone",
};

export default nextConfig;
