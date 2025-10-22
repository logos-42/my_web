// 文章数据和工具函数

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
  // 在构建时使用静态数据，避免文件系统操作
  const articles: Article[] = [
    {
      slug: '财富的本质',
      title: '财富的本质',
      date: '2025-03-26',
      category: 'articles',
      content: '# 财富的本质\n\n财富不仅仅是金钱...',
      excerpt: '财富不仅仅是金钱，更是一种思维方式和价值观念。',
      htmlContent: '<h1>财富的本质</h1><p>财富不仅仅是金钱...</p>'
    },
    {
      slug: '我靠AI发明了一种新语言',
      title: '我靠AI发明了一种新语言',
      date: '2025-03-25',
      category: 'articles',
      content: '# 我靠AI发明了一种新语言\n\n通过AI的帮助...',
      excerpt: '通过AI的帮助，我创造了一种全新的语言系统。',
      htmlContent: '<h1>我靠AI发明了一种新语言</h1><p>通过AI的帮助...</p>'
    },
    {
      slug: '恭喜避免浪费时间',
      title: '恭喜避免浪费时间',
      date: '2025-03-24',
      category: 'articles',
      content: '# 恭喜避免浪费时间\n\n时间管理的重要性...',
      excerpt: '时间管理是成功的关键因素之一。',
      htmlContent: '<h1>恭喜避免浪费时间</h1><p>时间管理的重要性...</p>'
    },
    {
      slug: 'ai-art',
      title: 'AI艺术',
      date: '2025-03-23',
      category: 'articles',
      content: '# AI艺术\n\n人工智能在艺术创作中的应用...',
      excerpt: '探索AI在艺术创作中的无限可能。',
      htmlContent: '<h1>AI艺术</h1><p>人工智能在艺术创作中的应用...</p>'
    },
    {
      slug: 'ecosystem',
      title: '生态系统',
      date: '2025-03-22',
      category: 'articles',
      content: '# 生态系统\n\n生态系统的平衡与保护...',
      excerpt: '了解生态系统的重要性及其保护方法。',
      htmlContent: '<h1>生态系统</h1><p>生态系统的平衡与保护...</p>'
    },
    {
      slug: 'generative-art',
      title: '生成艺术',
      date: '2025-03-21',
      category: 'articles',
      content: '# 生成艺术\n\n算法生成的艺术作品...',
      excerpt: '探索算法如何创造独特的艺术作品。',
      htmlContent: '<h1>生成艺术</h1><p>算法生成的艺术作品...</p>'
    }
  ];
  
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
