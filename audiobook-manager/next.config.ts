import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'test-3uh8.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'cdn.kobo.com',
      },
    ],
  },
};

export default nextConfig;