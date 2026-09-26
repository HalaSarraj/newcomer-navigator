import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // snowflake-sdk is a Node-only driver; load it from node_modules at runtime
  // instead of bundling it.
  serverExternalPackages: ["snowflake-sdk"],
};

export default nextConfig;
