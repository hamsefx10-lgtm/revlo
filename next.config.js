// next.config.js (for Next.js 14)
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for Electron (always enabled for better Electron compatibility)
  output: 'standalone',

  // Exclude directories with permission issues from file scanning
  webpack: (config, { isServer }) => {
    // Ignore problematic directories in watch mode
    if (config.watchOptions) {
      config.watchOptions.ignored = [
        ...(Array.isArray(config.watchOptions.ignored) ? config.watchOptions.ignored : []),
        '**/app/api/employees/salary-summary/**',
        '**/app/api/employees/[id]/attendance/**',
        '**/app/api/accounting/reports/projects/**',
      ];
    } else {
      config.watchOptions = {
        ignored: [
          '**/app/api/employees/salary-summary/**',
          '**/app/api/employees/[id]/attendance/**',
          '**/app/api/accounting/reports/projects/**',
        ],
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },
};

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA(nextConfig);
