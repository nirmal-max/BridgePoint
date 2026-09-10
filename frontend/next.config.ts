import type { NextConfig } from 'next';

// Backend base URL — used for the dev proxy rewrites.
// In production (Render/Vercel), set NEXT_PUBLIC_API_URL to the deployed
// backend URL; the rewrites are only active in development.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '') ||
  'http://127.0.0.1:8000';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },

  // ── Dev proxy: rewrite /api/* → FastAPI at BACKEND_URL/api/*
  //
  // This makes ALL api calls same-origin (localhost:3000/api/...)
  // so the service worker correctly sees /api/ in the pathname for
  // its bypass logic, CORS is eliminated, and no stale env-var
  // baked into client bundles can point to a wrong host.
  //
  // In production the frontend is deployed alongside the backend
  // (Render) or NEXT_PUBLIC_API_URL is set to the backend URL.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
