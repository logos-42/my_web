import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseArticle, detectPlatform } from './lib/parsers.js';
import { saveArticle, isUrlImported } from './lib/github.js';

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

async function triggerDeploy(): Promise<void> {
  const vercelToken = process.env.VERCEL_API_TOKEN;
  const projectId = 'prj_vMidJRUt8JStL25UsUMeWBqPypY0';
  
  if (!vercelToken) {
    console.log('VERCEL_API_TOKEN not set, skipping deploy trigger');
    return;
  }

  try {
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'liuyuanjie',
        projectId: projectId,
        target: 'production',
      }),
    });
    
    if (response.ok) {
      console.log('Deploy triggered successfully');
    } else {
      console.log('Deploy trigger failed:', response.status);
    }
  } catch (error) {
    console.error('Deploy trigger error:', error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = getUserFromCookie(req);
  if (!user) {
    return res.status(401).json({ error: '请先登录' });
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
      // 触发重新部署
      triggerDeploy().catch(console.error);
      
      return res.status(200).json({ 
        success: true, 
        article: {
          title: article.title,
          path: result.path,
          source: article.source
        },
        message: '文章已导入，正在重新部署网站...'
      });
    } else {
      return res.status(500).json({ error: result.error || '保存失败' });
    }
  } catch (error: any) {
    console.error('Import error:', error);
    return res.status(500).json({ error: error.message || '导入失败' });
  }
}
