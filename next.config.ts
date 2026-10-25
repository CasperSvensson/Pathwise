import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Bilduppladdning (max 5 MB) går via en server action – lite marginal här.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
