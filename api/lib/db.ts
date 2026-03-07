import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getDatabaseProvider, getMySqlPool } from './config.js';
import type { ImportedArticle } from './db_supabase.js';

// 内存存储（开发用/备用）
const memoryStore: Record<string, ImportedArticle> = {};

// 根据配置获取 Supabase 客户端
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}

// 获取 Vercel KV 客户端
async function getKvClient() {
  const { kv } = await import('@vercel/kv');
  return kv;
}

// ==================== 通用接口 ====================

// 获取所有导入的文章
export async function getImportedArticles(): Promise<Record<string, ImportedArticle>> {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'supabase':
      return getImportedArticlesSupabase();
    case 'kv':
      return getImportedArticlesKv();
    case 'mysql':
      return getImportedArticlesMysql();
    case 'memory':
      return { ...memoryStore };
    default:
      console.warn(`未知的数据库类型：${provider}，使用内存存储`);
      return { ...memoryStore };
  }
}

// 检查 URL 是否已导入
export async function isUrlImported(url: string): Promise<boolean> {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'supabase':
      return isUrlImportedSupabase(url);
    case 'kv':
      return isUrlImportedKv(url);
    case 'mysql':
      return isUrlImportedMysql(url);
    case 'memory':
      return !!memoryStore[url];
    default:
      return false;
  }
}

// 保存导入的文章
export async function saveArticle(
  article: Omit<ImportedArticle, 'id' | 'imported_at'>
): Promise<{ success: boolean; error?: string }> {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'supabase':
      return saveArticleSupabase(article);
    case 'kv':
      return saveArticleKv(article);
    case 'mysql':
      return saveArticleMysql(article);
    case 'memory':
      return saveArticleMemory(article);
    default:
      return { success: false, error: '未配置的数据库' };
  }
}

// 根据 URL 获取文章
export async function getArticleByUrl(url: string): Promise<ImportedArticle | null> {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'supabase':
      return getArticleByUrlSupabase(url);
    case 'kv':
      return getArticleByUrlKv(url);
    case 'mysql':
      return getArticleByUrlMysql(url);
    case 'memory':
      return memoryStore[url] || null;
    default:
      return null;
  }
}

// 删除文章
export async function deleteArticle(url: string): Promise<{ success: boolean; error?: string }> {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'supabase':
      return deleteArticleSupabase(url);
    case 'kv':
      return deleteArticleKv(url);
    case 'mysql':
      return deleteArticleMysql(url);
    case 'memory':
      return deleteArticleMemory(url);
    default:
      return { success: false, error: '未配置的数据库' };
  }
}

// ==================== Supabase 实现 ====================

async function getImportedArticlesSupabase(): Promise<Record<string, ImportedArticle>> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};

  try {
    const { data, error } = await supabase
      .from('imported_articles')
      .select('*')
      .order('imported_at', { ascending: false });

    if (error) throw error;

    const articles: Record<string, ImportedArticle> = {};
    if (data) {
      for (const article of data) {
        articles[article.url] = article;
      }
    }
    return articles;
  } catch (error) {
    console.error('Supabase fetch error:', error);
    return {};
  }
}

async function isUrlImportedSupabase(url: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { data } = await supabase
      .from('imported_articles')
      .select('url')
      .eq('url', url)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

async function saveArticleSupabase(
  article: Omit<ImportedArticle, 'id' | 'imported_at'>
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase 未配置' };

  try {
    const { error } = await supabase.from('imported_articles').insert({
      url: article.url,
      title: article.title,
      content: article.content,
      source: article.source,
      source_url: article.source_url,
      author: article.author || null,
      publish_date: article.publish_date || null,
      cover_image: article.cover_image || null,
      tags: article.tags || null,
      category: article.category,
      imported_at: new Date().toISOString()
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

async function getArticleByUrlSupabase(url: string): Promise<ImportedArticle | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from('imported_articles')
      .select('*')
      .eq('url', url)
      .single();
    return data || null;
  } catch {
    return null;
  }
}

async function deleteArticleSupabase(url: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase 未配置' };

  try {
    const { error } = await supabase
      .from('imported_articles')
      .delete()
      .eq('url', url);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

// ==================== Vercel KV 实现 ====================

const KV_ARTICLES_KEY = 'imported_articles';

async function getImportedArticlesKv(): Promise<Record<string, ImportedArticle>> {
  try {
    const kv = await getKvClient();
    const articles = await kv.get<Record<string, ImportedArticle>>(KV_ARTICLES_KEY);
    return articles || {};
  } catch (error) {
    console.error('KV fetch error:', error);
    return {};
  }
}

async function isUrlImportedKv(url: string): Promise<boolean> {
  const articles = await getImportedArticlesKv();
  return url in articles;
}

async function saveArticleKv(
  article: Omit<ImportedArticle, 'id' | 'imported_at'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const kv = await getKvClient();
    const articles = await getImportedArticlesKv();

    if (articles[article.url]) {
      return { success: false, error: '该文章已导入过' };
    }

    articles[article.url] = {
      ...article,
      imported_at: new Date().toISOString()
    } as ImportedArticle;

    await kv.set(KV_ARTICLES_KEY, articles);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

async function getArticleByUrlKv(url: string): Promise<ImportedArticle | null> {
  const articles = await getImportedArticlesKv();
  return articles[url] || null;
}

async function deleteArticleKv(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const kv = await getKvClient();
    const articles = await getImportedArticlesKv();
    
    if (!articles[url]) {
      return { success: false, error: '文章不存在' };
    }
    
    delete articles[url];
    await kv.set(KV_ARTICLES_KEY, articles);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

// ==================== MySQL 实现 ====================

const MYSQL_TABLE = 'imported_articles';

interface MysqlArticleRow {
  id: number;
  url: string;
  title: string;
  content: string;
  source: string;
  source_url: string;
  author: string | null;
  publish_date: string | null;
  cover_image: string | null;
  tags: string | null;
  category: string;
  imported_at: string;
}

function mysqlRowToArticle(row: MysqlArticleRow): ImportedArticle {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    content: row.content,
    source: row.source,
    source_url: row.source_url,
    author: row.author || undefined,
    publish_date: row.publish_date || undefined,
    cover_image: row.cover_image || undefined,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    category: row.category,
    imported_at: row.imported_at
  };
}

async function getImportedArticlesMysql(): Promise<Record<string, ImportedArticle>> {
  const pool = getMySqlPool();
  if (!pool) return {};

  try {
    const result = await new Promise<MysqlArticleRow[]>((resolve, reject) => {
      pool.query(
        `SELECT * FROM ${MYSQL_TABLE} ORDER BY imported_at DESC`,
        (err, results) => {
          if (err) reject(err);
          else resolve(results as MysqlArticleRow[]);
        }
      );
    });

    const articles: Record<string, ImportedArticle> = {};
    for (const row of result) {
      articles[row.url] = mysqlRowToArticle(row);
    }
    return articles;
  } catch (error) {
    console.error('MySQL fetch error:', error);
    return {};
  }
}

async function isUrlImportedMysql(url: string): Promise<boolean> {
  const pool = getMySqlPool();
  if (!pool) return false;

  try {
    const result = await new Promise<MysqlArticleRow[]>((resolve, reject) => {
      pool.query(
        `SELECT url FROM ${MYSQL_TABLE} WHERE url = ? LIMIT 1`,
        [url],
        (err, results) => {
          if (err) reject(err);
          else resolve(results as MysqlArticleRow[]);
        }
      );
    });
    return result.length > 0;
  } catch {
    return false;
  }
}

async function saveArticleMysql(
  article: Omit<ImportedArticle, 'id' | 'imported_at'>
): Promise<{ success: boolean; error?: string }> {
  const pool = getMySqlPool();
  if (!pool) return { success: false, error: 'MySQL 未配置' };

  // 先检查是否已存在
  if (await isUrlImportedMysql(article.url)) {
    return { success: false, error: '该文章已导入过' };
  }

  try {
    const importedAt = new Date().toISOString();
    const tagsJson = article.tags ? JSON.stringify(article.tags) : null;

    await new Promise<void>((resolve, reject) => {
      pool.query(
        `INSERT INTO ${MYSQL_TABLE} (url, title, content, source, source_url, author, publish_date, cover_image, tags, category, imported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          article.url,
          article.title,
          article.content,
          article.source,
          article.source_url,
          article.author || null,
          article.publish_date || null,
          article.cover_image || null,
          tagsJson,
          article.category,
          importedAt
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

async function getArticleByUrlMysql(url: string): Promise<ImportedArticle | null> {
  const pool = getMySqlPool();
  if (!pool) return null;

  try {
    const result = await new Promise<MysqlArticleRow[]>((resolve, reject) => {
      pool.query(
        `SELECT * FROM ${MYSQL_TABLE} WHERE url = ? LIMIT 1`,
        [url],
        (err, results) => {
          if (err) reject(err);
          else resolve(results as MysqlArticleRow[]);
        }
      );
    });

    if (result.length === 0) return null;
    return mysqlRowToArticle(result[0]);
  } catch {
    return null;
  }
}

async function deleteArticleMysql(url: string): Promise<{ success: boolean; error?: string }> {
  const pool = getMySqlPool();
  if (!pool) return { success: false, error: 'MySQL 未配置' };

  try {
    await new Promise<void>((resolve, reject) => {
      pool.query(
        `DELETE FROM ${MYSQL_TABLE} WHERE url = ?`,
        [url],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

// ==================== 内存存储实现 ====================

function saveArticleMemory(
  article: Omit<ImportedArticle, 'id' | 'imported_at'>
): { success: boolean; error?: string } {
  if (memoryStore[article.url]) {
    return { success: false, error: '该文章已导入过' };
  }

  memoryStore[article.url] = {
    ...article,
    imported_at: new Date().toISOString()
  } as ImportedArticle;

  return { success: true };
}
