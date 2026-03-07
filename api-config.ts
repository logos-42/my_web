/**
 * API 配置
 * 集中管理所有 API 相关的配置
 * 
 * 统一 API 入口：/api
 * 所有请求通过 query 参数或 path 区分不同功能
 */

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
  retry: {
    count: number;
    delay: number;
  };
}

/**
 * 开发环境配置
 */
const developmentConfig: ApiConfig = {
  baseUrl: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  retry: {
    count: 3,
    delay: 1000,
  },
};

/**
 * 生产环境配置
 */
const productionConfig: ApiConfig = {
  baseUrl: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  retry: {
    count: 3,
    delay: 1000,
  },
};

/**
 * 当前环境的 API 配置
 */
export const apiConfig: ApiConfig =
  import.meta.env.DEV ? developmentConfig : productionConfig;

/**
 * 统一 API 端点
 * 所有 API 请求都通过 /api 入口，通过路径区分功能
 */
export const API = {
  // OAuth 相关
  oauth: '/api/oauth',
  callback: '/api/callback',
  
  // 用户相关
  me: '/api/me',
  logout: '/api/logout',
  
  // 分类相关
  categories: '/api/categories',
  
  // 文章相关
  articles: '/api/articles',           // GET - 获取文章列表
  article: (url: string) => `/api/articles?url=${encodeURIComponent(url)}`,  // GET - 获取单篇文章
  
  // 导入相关
  imported: '/api/imported',           // GET - 获取已导入文章列表
  import: '/api/import',               // POST - 导入新文章
  delete: '/api/delete',               // POST - 删除文章
} as const;

/**
 * 获取完整的 API URL
 * @param endpoint API 端点
 * @returns 完整的 URL
 */
export function getApiUrl(endpoint: string): string {
  return `${apiConfig.baseUrl}${endpoint}`;
}

export default apiConfig;
