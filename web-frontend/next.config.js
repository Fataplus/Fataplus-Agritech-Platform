/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_AI_API_URL: process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8001',
  },

  // Image optimization settings
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Experimental features for better performance
  experimental: {
    // Enable webpack build worker
    webpackBuildWorker: true,
  },

  // TypeScript strict mode
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects and rewrites (disabled for local development)
  // async rewrites() {
  //   return [
  //     // API proxy for development
  //     {
  //       source: '/api/:path*',
  //       destination: 'http://web-backend:8000/api/:path*',
  //     },
  //     // AI services proxy for development
  //     {
  //       source: '/ai/:path*',
  //       destination: 'http://ai-services:8001/:path*',
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
