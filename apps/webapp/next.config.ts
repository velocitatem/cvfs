import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  async rewrites() {
    const backend = process.env.API_BASE_URL ?? "https://api.cv.alves.world";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
