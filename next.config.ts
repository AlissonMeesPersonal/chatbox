import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.facebook.com; font-src 'self'; connect-src 'self' https://graph.facebook.com https://www.facebook.com https://web.facebook.com; frame-src https://www.facebook.com https://web.facebook.com https://business.facebook.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
    ] }];
  },
};
export default config;
