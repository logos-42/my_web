import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getDatabaseProvider, isDatabaseConfigured } from './config.js';
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
    case 'memory':
      return { ...memoryStore };
    default:
      console.warn(`未知的数据库类型: ${provider}，使用内存存储`);
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
    case 'memory':
      return memoryStore[url] || null;
    default:
      return null;
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
