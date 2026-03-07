/**
 * 数据库配置
 * 支持多种数据库类型，便于切换
 *
 * 使用环境变量选择数据库类型：
 * - DATABASE_PROVIDER=supabase   使用 Supabase（默认）
 * - DATABASE_PROVIDER=kv         使用 Vercel KV
 * - DATABASE_PROVIDER=mysql      使用 MySQL
 * - DATABASE_PROVIDER=memory     使用内存存储（开发用）
 */

import { Pool as MysqlPool } from 'pg';

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

// ==================== MySQL 连接池创建 ====================

let mysqlPoolInstance: MysqlPool | null = null;

/**
 * 获取 MySQL 连接池（单例）
 */
export function getMySqlPool(): MysqlPool | null {
  if (mysqlPoolInstance) {
    return mysqlPoolInstance;
  }

  const host = process.env.MYSQL_HOST || process.env.DB_HOST;
  const port = parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10);
  const database = process.env.MYSQL_DATABASE || process.env.DB_DATABASE;
  const user = process.env.MYSQL_USER || process.env.DB_USER;
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;

  if (!host || !database || !user || !password) {
    return null;
  }

  mysqlPoolInstance = new MysqlPool({
    host,
    port,
    database,
    user,
    password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });

  return mysqlPoolInstance;
}

/**
 * 关闭 MySQL 连接池
 */
export async function closeMySqlPool(): Promise<void> {
  if (mysqlPoolInstance) {
    await mysqlPoolInstance.end();
    mysqlPoolInstance = null;
  }
}

// ==================== 数据库状态检查 ====================

/**
 * 获取数据库连接状态
 */
export async function getDatabaseStatus(): Promise<{
  provider: DatabaseProvider;
  label: string;
  connected: boolean;
  error?: string;
}> {
  const provider = getDatabaseProvider();
  const label = getDatabaseProviderLabel();

  try {
    switch (provider) {
      case 'supabase': {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return { provider, label, connected: false, error: '缺少环境变量' };
        }

        const client = createClient(supabaseUrl, supabaseKey);
        const { error } = await client.from('imported_articles').select('id').limit(1);
        
        if (error) {
          return { provider, label, connected: false, error: error.message };
        }
        return { provider, label, connected: true };
      }

      case 'kv': {
        const { kv } = await import('@vercel/kv');
        await kv.ping();
        return { provider, label, connected: true };
      }

      case 'mysql': {
        const pool = getMySqlPool();
        if (!pool) {
          return { provider, label, connected: false, error: '连接池创建失败' };
        }
        await new Promise((resolve, reject) => {
          pool.connect((err, client, release) => {
            if (err) {
              reject(err);
              return;
            }
            release();
            resolve(client);
          });
        });
        return { provider, label, connected: true };
      }

      case 'memory':
        return { provider, label, connected: true };

      default:
        return { provider, label, connected: false, error: '未知数据库类型' };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : '未知错误';
    return { provider, label, connected: false, error: msg };
  }
}
