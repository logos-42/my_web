/**
 * 数据库类型定义
 */

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
