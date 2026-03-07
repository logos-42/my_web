import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getArticleByUrl } from './lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = req.query.url as string;
  
  if (!url) {
    return res.status(400).json({ error: '缺少 URL 参数' });
  }

  try {
    const article = await getArticleByUrl(url);
    
    if (!article) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    return res.status(200).json({ 
      article: {
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
      }
    });
  } catch (error) {
    console.error('Failed to get article:', error);
    return res.status(500).json({ error: '获取文章失败' });
  }
}
