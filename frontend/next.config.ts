import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // In development, proxy to localhost
    // In production, use internal K8s service name from env var
    const apiUrl = process.env.API_URL || "http://127.0.0.1:8001";

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
