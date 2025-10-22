// 文章数据和工具函数
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import pinyin from 'pinyin';

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
  slug?: string; // 自定义slug字段
}

// 将中文字符转换为URL友好的slug
function convertChineseToSlug(chineseText: string): string {
  // 自定义映射表（用于特殊情况的覆盖）
  const customMappings: Record<string, string> = {
    '财富的本质': 'essence-of-wealth',
    '我靠AI发明了一种新语言': 'ai-invented-language',
    '恭喜避免浪费时间': 'avoid-wasting-time',
    '超越工具思维的新范式': 'beyond-instrumental-thinking',
    '异世界夺舍指南': 'isekai-possession-guide',
    '复杂科学导论': 'complexity-science-intro',
    '算法作曲实验': 'algorithmic-composition',
    '电子音乐作品集': 'electronic-music-collection',
    '生态系统思维': 'ecosystem-thinking',
    'AI艺术探索': 'ai-art-exploration',
    '生成艺术作品集': 'generative-art-collection',
    '博客文章': 'blog-posts',
    '项目展示': 'project-showcase'
  };
  
  // 如果找到自定义映射，使用自定义映射值
  if (customMappings[chineseText]) {
    return customMappings[chineseText];
  }
  
  // 使用拼音库自动转换中文
  try {
    const pinyinArray = pinyin(chineseText, {
      style: pinyin.STYLE_NORMAL, // 不带声调
      heteronym: false, // 不启用多音字模式
    });
    
    const slug = pinyinArray
      .map(item => item[0]) // 取第一个拼音
      .join('-')
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, '-') // 移除特殊字符
      .replace(/-+/g, '-') // 合并多个连字符
      .replace(/^-|-$/g, ''); // 移除首尾连字符
    
    return slug;
  } catch (error) {
    // 如果拼音转换失败，使用简单的字符替换
    console.warn('拼音转换失败，使用备用方案:', error);
    return chineseText
      .replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

// 获取所有文章
export function getAllArticles(): Article[] {
  const contentDir = path.join(process.cwd(), 'src/content');
  const articles: Article[] = [];

  // 遍历所有分类目录
  const categories = ['articles', 'essays', 'philosophy', 'music', 'blogs', 'projects'];
  
  categories.forEach(category => {
    const categoryDir = path.join(contentDir, category);
    
    if (fs.existsSync(categoryDir)) {
      const files = fs.readdirSync(categoryDir);
      
      files.forEach(file => {
        if (file.endsWith('.md')) {
          const originalSlug = file.replace('.md', '');
          const filePath = path.join(categoryDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          
          const { data, content } = matter(fileContent);
          
          // 优先使用frontmatter中的自定义slug，否则自动生成
          const slug = data.slug || convertChineseToSlug(originalSlug);
          
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
            category, // 使用目录名作为category，确保路由正确
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
