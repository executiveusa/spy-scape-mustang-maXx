const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.MAXX_NEXT_STANDALONE === 'true' || process.env.GITHUB_ACTIONS === 'true' ? 'standalone' : undefined,
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingExcludes: {
    '*': [
      './backend/.venv/**/*',
      './backend/data/**/*',
      './backend/runtime/**/*',
      './ops-checks/**/*',
      './asset-library/**/*',
      './prd/**/*',
      './*.png',
      './*.log',
      './node.msi',
    ],
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

module.exports = nextConfig;
