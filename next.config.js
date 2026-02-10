/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export for Cloudflare Pages (no Node.js runtime needed)
  output: 'export',
  trailingSlash: true,
  images: {
    domains: ['images.unsplash.com', 'yappy-verse.com'],
    unoptimized: true,
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

module.exports = nextConfig;
