/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '192.168.0.150',
    '100.81.160.239',
  ],
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.next/**',
      ],
    };
    return config;
  },
};

export default nextConfig;
