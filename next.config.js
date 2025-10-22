/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  // 为GitHub Pages启用静态导出
  output: 'export',
  trailingSlash: true,
  distDir: 'out'
};

module.exports = nextConfig;
