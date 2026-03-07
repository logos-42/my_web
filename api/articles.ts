import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getImportedArticles } from './lib/db.js';
import { getDatabaseProviderLabel } from './lib/config.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const articles = await getImportedArticles();
    const category = req.query.category as string | undefined;
    
    let articlesList = Object.entries(articles).map(([url, article]) => ({
      url,
      title: article.title,
      content: article.content,
      source: article.source,
      sourceUrl: article.source_url,
      author: article.author,
      publishDate: article.publish_date,
      coverImage: article.cover_image,
      tags: article.tags,
      category: article.category,
      importedAt: article.imported_at
    }));
    
    // 如果指定了分类，则过滤
    if (category) {
      articlesList = articlesList.filter(a => a.category === category);
    }
    
    // 按导入时间倒序排列
    articlesList.sort((a, b) => 
      new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    );
    
    return res.status(200).json({ 
      articles: articlesList,
      provider: getDatabaseProviderLabel()
    });
  } catch (error) {
    console.error('Failed to get articles:', error);
    return res.status(200).json({ articles: [], provider: getDatabaseProviderLabel() });
  }
}
