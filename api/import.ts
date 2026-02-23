import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseArticle, detectPlatform } from './lib/parsers';
import { saveArticle, isUrlImported } from './lib/github';

export const config = {
  api: {
    externalResolver: true,
  },
};

function getUserFromCookie(req: VercelRequest): { login: string } | null {
  const userCookie = req.cookies?.user;
  if (!userCookie) return null;
  
  try {
    const userInfo = JSON.parse(Buffer.from(userCookie, 'base64').toString());
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = getUserFromCookie(req);
  if (!user) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  const { url, category } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: '缺少 URL 参数' });
  }

  try {
    const platform = detectPlatform(url);
    if (!platform) {
      return res.status(400).json({ error: '不支持的平台，支持：微信公众号、知乎、Paragraph、Substack' });
    }

    const alreadyImported = await isUrlImported(url);
    if (alreadyImported) {
      return res.status(400).json({ error: '该文章已导入过' });
    }

    const article = await parseArticle(url);
    const result = await saveArticle(article, category || 'imported');
    
    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        article: {
          title: article.title,
          path: result.path,
          source: article.source
        }
      });
    } else {
      return res.status(500).json({ error: result.error || '保存失败' });
    }
  } catch (error: any) {
    console.error('Import error:', error);
    return res.status(500).json({ error: error.message || '导入失败' });
  }
}
