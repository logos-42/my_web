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

// 将中文字符转换为URL友好的slug
function convertChineseToSlug(chineseText: string): string {
  // 中文到英文的映射表
  const chineseToEnglish: Record<string, string> = {
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
  
  // 如果找到映射，使用映射值
  if (chineseToEnglish[chineseText]) {
    return chineseToEnglish[chineseText];
  }
  
  // 否则，将中文字符转换为拼音（简化版本）
  return chineseText
    .replace(/[\u4e00-\u9fff]/g, (char) => {
      // 这里可以集成拼音库，暂时使用简单的映射
      const pinyinMap: Record<string, string> = {
        '财': 'cai', '富': 'fu', '的': 'de', '本': 'ben', '质': 'zhi',
        '我': 'wo', '靠': 'kao', '发': 'fa', '明': 'ming', '了': 'le', '一': 'yi', '种': 'zhong', '新': 'xin', '语': 'yu', '言': 'yan',
        '恭': 'gong', '喜': 'xi', '避': 'bi', '免': 'mian', '浪': 'lang', '费': 'fei', '时': 'shi', '间': 'jian',
        '超': 'chao', '越': 'yue', '工': 'gong', '具': 'ju', '思': 'si', '维': 'wei', '范': 'fan', '式': 'shi',
        '异': 'yi', '世': 'shi', '界': 'jie', '夺': 'duo', '舍': 'she', '指': 'zhi', '南': 'nan',
        '复': 'fu', '杂': 'za', '科': 'ke', '学': 'xue', '导': 'dao', '论': 'lun',
        '算': 'suan', '法': 'fa', '作': 'zuo', '曲': 'qu', '实': 'shi', '验': 'yan',
        '电': 'dian', '子': 'zi', '音': 'yin', '乐': 'yue', '作': 'zuo', '品': 'pin', '集': 'ji',
        '生': 'sheng', '态': 'tai', '系': 'xi', '统': 'tong', '思': 'si', '维': 'wei',
        '艺': 'yi', '术': 'shu', '探': 'tan', '索': 'suo',
        '博': 'bo', '客': 'ke', '文': 'wen', '章': 'zhang',
        '项': 'xiang', '目': 'mu', '展': 'zhan', '示': 'shi'
      };
      return pinyinMap[char] || char;
    })
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
          // 将中文字符转换为拼音或英文标识符
          const slug = convertChineseToSlug(originalSlug);
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
