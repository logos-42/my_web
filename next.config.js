const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  // 移除静态导出配置，使用标准Next.js构建
  trailingSlash: true,
  webpack: (config) => {
    // 配置 Webpack 别名，确保 @/ 路径在所有环境下都能正确解析
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/styles': path.resolve(__dirname, 'src/styles'),
      '@/types': path.resolve(__dirname, 'src/types'),
    };
    return config;
  }
};


module.exports = nextConfig;
