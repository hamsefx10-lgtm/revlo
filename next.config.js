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
};

module.exports = nextConfig;
