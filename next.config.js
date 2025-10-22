/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  // 静态导出配置，适合GitHub Pages部署
  output: 'export',
  trailingSlash: true,
  distDir: 'dist'
};

module.exports = nextConfig;
