// Shared types for parsers

export interface ParsedArticle {
  title: string;
  content: string;
  author?: string;
  date?: string;
  publishDate?: string;
  source: string;
  sourceUrl: string;
  coverImage?: string;
  tags?: string[];
}

export type Platform = 'wechat' | 'zhihu' | 'paragraph' | 'substack' | 'medium' | 'unknown';

export interface ParseResult {
  success: boolean;
  article?: ParsedArticle;
  error?: string;
}

// ==================== 图片绑定相关类型 ====================

/**
 * 图片与文章的绑定关系
 */
export interface ImageBinding {
  imageNumber: number;        // 图片编号（对应 finish/thumbnail_{number}.jpg）
  articleUrl: string;         // 绑定的文章 URL
  articleTitle: string;       // 文章标题（用于显示）
  boundAt: string;            // 绑定时间
}

/**
 * 图片绑定列表响应
 */
export interface ImageBindingsResponse {
  bindings: ImageBinding[];
  totalImages: number;        // 总图片数量
}

/**
 * 绑定请求
 */
export interface BindRequest {
  imageNumber: number;
  articleUrl: string;
  articleTitle: string;
}

/**
 * 解绑请求
 */
export interface UnbindRequest {
  imageNumber: number;
}