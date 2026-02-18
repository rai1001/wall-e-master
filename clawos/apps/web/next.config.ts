import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: join(__dirname, "../.."),
  allowedDevOrigins: ["http://127.0.0.1:3100", "http://localhost:3100", "http://127.0.0.1:3000", "http://localhost:3000"]
};

export default nextConfig;
