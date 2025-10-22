// 文章数据和工具函数
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

export interface Article {
  slug: string;
  title: string;
  date: string;
  category: string;
  content: string;
  excerpt?: string;
  htmlContent?: string;
}

export interface ArticleMetadata {
  title: string;
  date: string;
  excerpt?: string;
  category?: string;
}

// 获取所有文章
export function getAllArticles(): Article[] {
  const contentDir = path.join(process.cwd(), 'src/content');
  const articles: Article[] = [];

  // 遍历所有分类目录
  const categories = ['articles', 'philosophy', 'music', 'blogs', 'projects'];
  
  categories.forEach(category => {
    const categoryDir = path.join(contentDir, category);
    
    if (fs.existsSync(categoryDir)) {
      const files = fs.readdirSync(categoryDir);
      
      files.forEach(file => {
        if (file.endsWith('.md')) {
          const slug = file.replace('.md', '');
          const filePath = path.join(categoryDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          
          const { data, content } = matter(fileContent);
          
          // 处理Markdown转HTML
          const processedContent = remark()
            .use(remarkHtml)
            .processSync(content);
          
          const htmlContent = processedContent.toString();
          
          // 生成摘要（取前150个字符）
          const excerpt = content.replace(/[#*`]/g, '').substring(0, 150) + '...';
          
          articles.push({
            slug,
            title: data.title || slug,
            date: data.date || new Date().toISOString().split('T')[0],
            category,
            content,
            excerpt,
            htmlContent
          });
        }
      });
    }
  });
  
  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// 根据分类获取文章
export function getArticlesByCategory(category: string): Article[] {
  const allArticles = getAllArticles();
  return allArticles.filter(article => article.category === category);
}

// 根据slug获取单篇文章
export function getArticleBySlug(slug: string, category?: string): Article | null {
  const allArticles = getAllArticles();
  const article = allArticles.find(article => {
    if (category) {
      return article.slug === slug && article.category === category;
    }
    return article.slug === slug;
  });
  
  return article || null;
}

// 获取文章列表（用于首页显示）
export function getArticleList(limit?: number): Article[] {
  const articles = getAllArticles();
  return limit ? articles.slice(0, limit) : articles;
}

// 获取所有分类
export function getAllCategories(): string[] {
  // 返回静态分类列表
  return ['articles', 'philosophy', 'music', 'blogs'];
}
