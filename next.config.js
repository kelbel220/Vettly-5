/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Fixes hot module replacement issues
    if (!isServer) {
      config.optimization.runtimeChunk = 'single';
    }
    return config;
  },
}

module.exports = nextConfig
