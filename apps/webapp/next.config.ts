import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  async rewrites() {
    // In Docker (Dokploy/compose) the backend container is always reachable at cvfs-backend:8080.
    // Override with API_BASE_URL for local dev (e.g. http://localhost:9812).
    const backend = process.env.API_BASE_URL ?? "http://cvfs-backend:8080";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
