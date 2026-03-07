import { createClient } from '@supabase/supabase-js';

// Supabase 客户端配置
// 支持多种环境变量命名方式
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 环境变量未配置');
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? '已设置' : '未设置');
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface ImportedArticle {
  id?: number;
  url: string;
  title: string;
  content: string;
  source: string;
  source_url: string;
  author?: string;
  publish_date?: string;
  cover_image?: string;
  tags?: string[];
  category: string;
  imported_at: string;
}

// 获取所有导入的文章
export async function getImportedArticles(): Promise<Record<string, ImportedArticle>> {
  if (!supabase) {
    console.error('Supabase 未初始化');
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('imported_articles')
      .select('*')
      .order('imported_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch articles:', error);
      return {};
    }

    const articles: Record<string, ImportedArticle> = {};
    if (data) {
      for (const article of data) {
        articles[article.url] = article;
      }
    }
    return articles;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return {};
  }
}

// 检查 URL 是否已导入
export async function isUrlImported(url: string): Promise<boolean> {
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

// 保存导入的文章
export async function saveArticle(
  article: Omit<ImportedArticle, 'id' | 'imported_at'>
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase 未初始化' };
  }

  try {
    const { error } = await supabase
      .from('imported_articles')
      .insert({
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

    if (error) {
      console.error('Failed to save article:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// 根据 URL 获取文章
export async function getArticleByUrl(url: string): Promise<ImportedArticle | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('imported_articles')
      .select('*')
      .eq('url', url)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
