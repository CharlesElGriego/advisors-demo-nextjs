import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'si.keen.com',
        pathname: '/memberphotos/**'
      }
    ]
  }
};

export default nextConfig;
