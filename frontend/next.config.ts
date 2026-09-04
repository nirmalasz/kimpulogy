import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: process.env.INTERNAL_BACKEND_URL
          ? `${process.env.INTERNAL_BACKEND_URL}/api/v1/:path*`
          : "http://localhost:8080/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
