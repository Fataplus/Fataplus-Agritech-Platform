/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables avec nouvelles URLs
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://fataplus-worker.fata-plus.workers.dev',
    NEXT_PUBLIC_AI_API_URL: process.env.NEXT_PUBLIC_AI_API_URL || 'https://fataplus-worker.fata-plus.workers.dev/ai',
    NEXT_PUBLIC_MCP_SERVER_URL: process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'https://fataplus-mcp.fata-plus.workers.dev',
  },

  // Image optimization - ajout du nouveau domaine
  images: {
    domains: [
      'localhost', 
      'fata.plus', 
      'app.fata.plus',
      'fataplus-staging.pages.dev',
      'fataplus-worker.fata-plus.workers.dev'
    ],
  },

  // Experimental features pour de meilleures performances
  experimental: {
    webpackBuildWorker: true,
  },

  // TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Headers pour la sécurité et la performance
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
          {
            key: 'X-Powered-By',
            value: 'Fataplus AgriTech Platform',
          },
        ],
      },
    ];
  },

  // Configuration pour Cloudflare Pages
  trailingSlash: false,
  poweredByHeader: false,

  // Configuration des redirections pour le nouveau domaine
  async redirects() {
    return [
      // Redirection des anciennes URLs si nécessaire
      {
        source: '/old-path/:path*',
        destination: '/new-path/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
