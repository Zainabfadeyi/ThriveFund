import type { NextConfig } from 'next';

const isExport = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isExport && { output: 'export', trailingSlash: true }),
  images: { unoptimized: true },
};

export default nextConfig;
