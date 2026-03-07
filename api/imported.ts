import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getImportedArticles } from './lib/db.js';
import { getDatabaseProviderLabel } from './lib/config.js';

function getUserFromCookie(req: VercelRequest): { login: string } | null {
  try {
    const cookies = req.headers.cookie;
    if (!cookies) return null;
    
    const userMatch = cookies.match(/user=([^;]+)/);
    if (!userMatch) return null;
    
    const userInfo = JSON.parse(Buffer.from(userMatch[1], 'base64').toString());
    const adminGithubId = process.env.ADMIN_GITHUB_ID;
    
    if (userInfo.login !== adminGithubId) {
      return null;
    }
    
    return { login: userInfo.login };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 任何登录用户都可以查看已导入的文章
  const user = getUserFromCookie(req);

  try {
    const articles = await getImportedArticles();
    
    // 转换为前端需要的格式
    const urls: Record<string, { title: string; importedAt: string; path: string }> = {};
    
    for (const [url, article] of Object.entries(articles)) {
      urls[url] = {
        title: article.title,
        importedAt: article.imported_at,
        path: article.category
      };
    }
    
    return res.status(200).json({ 
      urls,
      provider: getDatabaseProviderLabel()
    });
  } catch (error) {
    console.error('Failed to get imported articles:', error);
    return res.status(200).json({ urls: {}, provider: getDatabaseProviderLabel() });
  }
}
