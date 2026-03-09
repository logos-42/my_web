import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getDatabaseProvider, getMySqlPool } from './config.js';
import type { ImportedArticle } from './db_supabase.js';

// 内存存储（开发用/备用）
const memoryStore: Record<string, ImportedArticle> = {};

// 图片绑定存储
const imageBindingsMemory: Record<number, { articleUrl: string; articleTitle: string; boundAt: string }> = {};

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
      return { success: true }; // 内存存储在获取时直接返回副本，删除只是标记
    default:
      return { success: false, error: '未配置的数据库' };
  }
}

// 更新文章
export async function updateArticle(
  url: string,
  updates: Partial<Pick<ImportedArticle, 'title' | 'content' | 'category'>>
): Promise<{ success: boolean; error?: string }> {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'supabase':
      return updateArticleSupabase(url, updates);
    case 'kv':
      return updateArticleKv(url, updates);
    case 'mysql':
      return updateArticleMysql(url, updates);
    case 'memory':
      return { success: true }; // 内存存储在获取时直接返回副本
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

async function updateArticleSupabase(
  url: string,
  updates: Partial<Pick<ImportedArticle, 'title' | 'content' | 'category'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase 未配置' };

  try {
    const updateData: Record<string, any> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.category !== undefined) updateData.category = updates.category;

    const { error } = await supabase
      .from('imported_articles')
      .update(updateData)
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

async function updateArticleKv(
  url: string,
  updates: Partial<Pick<ImportedArticle, 'title' | 'content' | 'category'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const kv = await getKvClient();
    const articles = await getImportedArticlesKv();

    if (!articles[url]) {
      return { success: false, error: '文章不存在' };
    }

    if (updates.title !== undefined) articles[url].title = updates.title;
    if (updates.content !== undefined) articles[url].content = updates.content;
    if (updates.category !== undefined) articles[url].category = updates.category;

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
        (err: Error | null, results: any) => {
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
        (err: Error | null, results: any) => {
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
        (err: Error | null, results: any) => {
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

async function updateArticleMysql(
  url: string,
  updates: Partial<Pick<ImportedArticle, 'title' | 'content' | 'category'>>
): Promise<{ success: boolean; error?: string }> {
  const pool = getMySqlPool();
  if (!pool) return { success: false, error: 'MySQL 未配置' };

  try {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      updateFields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.category !== undefined) {
      updateFields.push('category = ?');
      values.push(updates.category);
    }

    if (updateFields.length === 0) {
      return { success: true };
    }

    values.push(url);

    await new Promise<void>((resolve, reject) => {
      pool.query(
        `UPDATE ${MYSQL_TABLE} SET ${updateFields.join(', ')} WHERE url = ?`,
        values,
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

function deleteArticleMemory(url: string): { success: boolean; error?: string } {
  if (!memoryStore[url]) {
    return { success: false, error: '文章不存在' };
  }

  delete memoryStore[url];
  return { success: true };
}

// ==================== 图片绑定相关功能 ====================

const BINDINGS_KEY = 'image_bindings';

/**
 * 获取所有图片绑定关系
 */
export async function getImageBindings(): Promise<Record<number, { articleUrl: string; articleTitle: string; boundAt: string }>> {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'supabase':
      return getImageBindingsSupabase();
    case 'kv':
      return getImageBindingsKv();
    case 'mysql':
      return getImageBindingsMysql();
    case 'memory':
      return { ...imageBindingsMemory };
    default:
      return { ...imageBindingsMemory };
  }
}

/**
 * 绑定图片到文章
 */
export async function bindImage(
  imageNumber: number,
  articleUrl: string,
  articleTitle: string
): Promise<{ success: boolean; error?: string }> {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'supabase':
      return bindImageSupabase(imageNumber, articleUrl, articleTitle);
    case 'kv':
      return bindImageKv(imageNumber, articleUrl, articleTitle);
    case 'mysql':
      return bindImageMysql(imageNumber, articleUrl, articleTitle);
    case 'memory':
      return bindImageMemory(imageNumber, articleUrl, articleTitle);
    default:
      return bindImageMemory(imageNumber, articleUrl, articleTitle);
  }
}

/**
 * 解绑图片
 */
export async function unbindImage(imageNumber: number): Promise<{ success: boolean; error?: string }> {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'supabase':
      return unbindImageSupabase(imageNumber);
    case 'kv':
      return unbindImageKv(imageNumber);
    case 'mysql':
      return unbindImageMysql(imageNumber);
    case 'memory':
      return unbindImageMemory(imageNumber);
    default:
      return unbindImageMemory(imageNumber);
  }
}

/**
 * 根据文章 URL 获取绑定的图片
 */
export async function getBindingsByArticleUrl(articleUrl: string): Promise<number[]> {
  const bindings = await getImageBindings();
  const boundImages: number[] = [];
  
  for (const [imageNumStr, binding] of Object.entries(bindings)) {
    if (binding.articleUrl === articleUrl) {
      boundImages.push(parseInt(imageNumStr, 10));
    }
  }
  
  return boundImages;
}

/**
 * 删除文章时同步删除绑定关系
 */
export async function deleteBindingsByArticleUrl(articleUrl: string): Promise<{ success: boolean; error?: string }> {
  const bindings = await getImageBindings();
  const imagesToDelete: number[] = [];
  
  for (const [imageNumStr, binding] of Object.entries(bindings)) {
    if (binding.articleUrl === articleUrl) {
      imagesToDelete.push(parseInt(imageNumStr, 10));
    }
  }
  
  // 逐个解绑
  for (const imageNumber of imagesToDelete) {
    await unbindImage(imageNumber);
  }
  
  return { success: true };
}

// ==================== Supabase 实现 ====================

async function getImageBindingsSupabase(): Promise<Record<number, { articleUrl: string; articleTitle: string; boundAt: string }>> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};

  try {
    const { data, error } = await supabase
      .from('image_bindings')
      .select('*')
      .order('bound_at', { ascending: false });

    if (error) throw error;

    const bindings: Record<number, { articleUrl: string; articleTitle: string; boundAt: string }> = {};
    if (data) {
      for (const item of data) {
        bindings[item.image_number] = {
          articleUrl: item.article_url,
          articleTitle: item.article_title,
          boundAt: item.bound_at
        };
      }
    }
    return bindings;
  } catch (error) {
    console.error('Supabase bindings fetch error:', error);
    return {};
  }
}

async function bindImageSupabase(
  imageNumber: number,
  articleUrl: string,
  articleTitle: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase 未配置' };

  try {
    const boundAt = new Date().toISOString();
    const { error } = await supabase.from('image_bindings').upsert({
      image_number: imageNumber,
      article_url: articleUrl,
      article_title: articleTitle,
      bound_at: boundAt
    }, { onConflict: 'image_number' });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

async function unbindImageSupabase(imageNumber: number): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase 未配置' };

  try {
    const { error } = await supabase
      .from('image_bindings')
      .delete()
      .eq('image_number', imageNumber);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

// ==================== Vercel KV 实现 ====================

async function getImageBindingsKv(): Promise<Record<number, { articleUrl: string; articleTitle: string; boundAt: string }>> {
  try {
    const kv = await getKvClient();
    const bindings = await kv.get<Record<number, { articleUrl: string; articleTitle: string; boundAt: string }>>(BINDINGS_KEY);
    return bindings || {};
  } catch (error) {
    console.error('KV bindings fetch error:', error);
    return {};
  }
}

async function bindImageKv(
  imageNumber: number,
  articleUrl: string,
  articleTitle: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const kv = await getKvClient();
    const bindings = await getImageBindingsKv();

    bindings[imageNumber] = {
      articleUrl,
      articleTitle,
      boundAt: new Date().toISOString()
    };

    await kv.set(BINDINGS_KEY, bindings);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

async function unbindImageKv(imageNumber: number): Promise<{ success: boolean; error?: string }> {
  try {
    const kv = await getKvClient();
    const bindings = await getImageBindingsKv();

    delete bindings[imageNumber];
    await kv.set(BINDINGS_KEY, bindings);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

// ==================== MySQL 实现 ====================

interface MysqlBindingRow {
  id: number;
  image_number: number;
  article_url: string;
  article_title: string;
  bound_at: string;
}

async function getImageBindingsMysql(): Promise<Record<number, { articleUrl: string; articleTitle: string; boundAt: string }>> {
  const pool = getMySqlPool();
  if (!pool) return {};

  try {
    const result = await new Promise<MysqlBindingRow[]>((resolve, reject) => {
      pool.query(
        'SELECT * FROM image_bindings ORDER BY bound_at DESC',
        (err: Error | null, results: any) => {
          if (err) reject(err);
          else resolve(results as MysqlBindingRow[]);
        }
      );
    });

    const bindings: Record<number, { articleUrl: string; articleTitle: string; boundAt: string }> = {};
    for (const row of result) {
      bindings[row.image_number] = {
        articleUrl: row.article_url,
        articleTitle: row.article_title,
        boundAt: row.bound_at
      };
    }
    return bindings;
  } catch (error) {
    console.error('MySQL bindings fetch error:', error);
    return {};
  }
}

async function bindImageMysql(
  imageNumber: number,
  articleUrl: string,
  articleTitle: string
): Promise<{ success: boolean; error?: string }> {
  const pool = getMySqlPool();
  if (!pool) return { success: false, error: 'MySQL 未配置' };

  try {
    const boundAt = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      pool.query(
        'INSERT INTO image_bindings (image_number, article_url, article_title, bound_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE article_url = VALUES(article_url), article_title = VALUES(article_title), bound_at = VALUES(bound_at)',
        [imageNumber, articleUrl, articleTitle, boundAt],
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

async function unbindImageMysql(imageNumber: number): Promise<{ success: boolean; error?: string }> {
  const pool = getMySqlPool();
  if (!pool) return { success: false, error: 'MySQL 未配置' };

  try {
    await new Promise<void>((resolve, reject) => {
      pool.query(
        'DELETE FROM image_bindings WHERE image_number = ?',
        [imageNumber],
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

function bindImageMemory(
  imageNumber: number,
  articleUrl: string,
  articleTitle: string
): { success: boolean; error?: string } {
  imageBindingsMemory[imageNumber] = {
    articleUrl,
    articleTitle,
    boundAt: new Date().toISOString()
  };

  return { success: true };
}

function unbindImageMemory(imageNumber: number): { success: boolean; error?: string } {
  delete imageBindingsMemory[imageNumber];
  return { success: true };
}
