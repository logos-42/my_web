/**
 * 数据库配置
 * 支持多种数据库类型，便于切换
 * 
 * 使用环境变量选择数据库类型：
 * - DATABASE_PROVIDER=supabase   使用 Supabase（默认）
 * - DATABASE_PROVIDER=kv         使用 Vercel KV
 * - DATABASE_PROVIDER=mysql      使用 MySQL
 */

export type DatabaseProvider = 'supabase' | 'kv' | 'mysql' | 'memory';

// 获取当前使用的数据库类型
export function getDatabaseProvider(): DatabaseProvider {
  const provider = process.env.DATABASE_PROVIDER?.toLowerCase();
  
  switch (provider) {
    case 'kv':
      return 'kv';
    case 'mysql':
      return 'mysql';
    case 'memory':
      return 'memory';
    case 'supabase':
    default:
      return 'supabase';
  }
}

// 获取数据库配置信息（用于日志和调试）
export function getDatabaseConfig() {
  const provider = getDatabaseProvider();
  
  const config = {
    provider,
    supabase: {
      url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      hasKey: !!(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    },
    kv: {
      url: process.env.KV_REST_API_URL,
      hasKey: !!process.env.KV_REST_API_TOKEN
    },
    mysql: {
      host: process.env.MYSQL_HOST || process.env.DB_HOST,
      port: process.env.MYSQL_PORT || process.env.DB_PORT || '3306',
      database: process.env.MYSQL_DATABASE || process.env.DB_DATABASE,
      user: process.env.MYSQL_USER || process.env.DB_USER,
      hasPassword: !!(process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD)
    }
  };
  
  return config;
}

// 检查数据库是否可用
export function isDatabaseConfigured(): boolean {
  const provider = getDatabaseProvider();
  
  switch (provider) {
    case 'supabase':
      return !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
             !!(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    case 'kv':
      return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
    
    case 'mysql':
      return !!(process.env.MYSQL_HOST || process.env.DB_HOST) &&
             !!(process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD);
    
    case 'memory':
      return true;
    
    default:
      return false;
  }
}

// 数据库类型标签（用于显示）
export function getDatabaseProviderLabel(): string {
  const provider = getDatabaseProvider();
  const labels: Record<DatabaseProvider, string> = {
    supabase: 'Supabase',
    kv: 'Vercel KV',
    mysql: 'MySQL',
    memory: '内存（开发用）'
  };
  return labels[provider] || '未知';
}
