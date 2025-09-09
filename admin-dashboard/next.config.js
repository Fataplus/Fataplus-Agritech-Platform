/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_SMOLLM2_URL: process.env.NEXT_PUBLIC_SMOLLM2_URL || 'http://localhost:8002',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
      {
        source: '/ai/:path*',
        destination: `${process.env.NEXT_PUBLIC_SMOLLM2_URL}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
