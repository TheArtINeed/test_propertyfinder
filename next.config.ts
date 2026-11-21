import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages read the DLD snapshot with fs at runtime; ship it with the serverless functions.
  outputFileTracingIncludes: {
    "/**": ["./dataset/dld_jvc_sales.json", "./dataset/dld_jvc_rents.json", "./dataset/listings.json"],
  },
};

export default nextConfig;
