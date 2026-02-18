import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: join(__dirname, "../.."),
  allowedDevOrigins: ["127.0.0.1", "localhost"]
};

export default nextConfig;
