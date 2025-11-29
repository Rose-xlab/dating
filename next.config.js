/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });
    if (isServer) {
      config.externals.push('@node-rs/argon2', '@node-rs/bcrypt');
    }
    return config;
  },
}

module.exports = nextConfig