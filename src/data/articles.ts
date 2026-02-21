// 文章数据和工具函数
import pinyin from 'pinyin';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export interface Article {
  slug: string;
  title: string;
  date: string;
  category: string;
  content: string;
  excerpt?: string;
  htmlContent?: string;
}

// 将中文字符转换为 URL 友好的 slug
function convertChineseToSlug(chineseText: string): string {
  const customMappings: Record<string, string> = {
    '财富的本质': 'essence-of-wealth',
    '我靠 AI 发明了一种新语言': 'ai-invented-language',
    '恭喜避免浪费时间': 'avoid-wasting-time',
    '超越工具思维的新范式': 'beyond-instrumental-thinking',
    '异世界夺舍指南': 'isekai-possession-guide',
    '复杂科学导论': 'complexity-science-intro',
    '算法作曲实验': 'algorithmic-composition',
    '电子音乐作品集': 'electronic-music-collection',
    '生态系统思维': 'ecosystem-thinking',
    'AI 艺术探索': 'ai-art-exploration',
    '生成艺术作品集': 'generative-art-collection',
    '博客文章': 'blog-posts',
    '项目展示': 'project-showcase'
  };

  if (customMappings[chineseText]) {
    return customMappings[chineseText];
  }

  try {
    const pinyinArray = pinyin(chineseText, {
      style: pinyin.STYLE_NORMAL,
      heteronym: false,
    });

    const slug = pinyinArray
      .map(item => item[0])
      .join('-')
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return slug;
  } catch (error) {
    console.warn('拼音转换失败，使用备用方案:', error);
    return chineseText
      .replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

// 解析 frontmatter
function parseFrontmatter(content: string): { data: Record<string, string>; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const matchResult = content.match(frontmatterRegex);
  
  let data: Record<string, string> = {};
  let bodyContent = content;

  if (matchResult) {
    const frontmatter = matchResult[1];
    bodyContent = matchResult[2];
    
    frontmatter.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        data[key.trim()] = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      }
    });
  }

  return { data, content: bodyContent };
}

// 使用 Vite 的 import.meta.glob 动态导入所有 markdown 文件
const mdModules = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default', eager: true });

function parseMarkdownFile(filePath: string, content: string): Article | null {
  const match = filePath.match(/\/content\/([^\/]+)\/([^\/]+)\.md$/);
  if (!match) return null;

  const category = match[1];
  const fileName = match[2];

  const { data, content: bodyContent } = parseFrontmatter(content);

  const originalSlug = fileName;
  const slug = data.slug || convertChineseToSlug(originalSlug);
  const title = data.title || slug;
  const date = data.date || new Date().toISOString().split('T')[0];
  const excerpt = data.excerpt || bodyContent.replace(/[#*`]/g, '').substring(0, 150) + '...';

  return {
    slug,
    title,
    date,
    category,
    content: bodyContent,
    excerpt,
    htmlContent: marked.parse(bodyContent) as string,
  };
}

// 获取所有文章
export function getAllArticles(): Article[] {
  const articles: Article[] = [];

  for (const [filePath, content] of Object.entries(mdModules)) {
    const article = parseMarkdownFile(filePath, content as string);
    if (article) {
      articles.push(article);
    }
  }

  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// 根据分类获取文章
export function getArticlesByCategory(category: string): Article[] {
  const allArticles = getAllArticles();
  return allArticles.filter(article => article.category === category);
}

// 根据 slug 获取单篇文章
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
  return ['articles', 'philosophy', 'music', 'blogs', 'essays', 'projects'];
}
