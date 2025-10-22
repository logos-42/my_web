/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  // 移除静态导出配置，使用标准Next.js构建
  trailingSlash: true
};

module.exports = nextConfig;
