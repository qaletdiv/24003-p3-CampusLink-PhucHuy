// The browser only ever talks to Next.js; requests to /api/* are forwarded to the Express API.
// Same origin for pages and API means the session cookie just works and no CORS setup is needed.
const API_URL = process.env.API_URL || 'http://localhost:3000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
