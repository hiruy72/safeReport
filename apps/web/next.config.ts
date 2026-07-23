import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@safeher/shared-types"],
  outputFileTracingRoot: path.join(__dirname, "../../.."),
};

export default nextConfig;
// _rev: 639204336150000000
