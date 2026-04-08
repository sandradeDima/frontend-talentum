import type { NextConfig } from 'next';

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:4000/api';
const backendOrigin = apiUrl.replace(/\/api\/?$/, '');
const backendUrl = new URL(backendOrigin);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: backendUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: backendUrl.hostname,
        port: backendUrl.port || undefined,
        pathname: '/**'
      }
    ]
  }
};

export default nextConfig;
