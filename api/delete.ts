import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase.js';

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

  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: '缺少 URL 参数' });
  }

  try {
    const { error } = await supabase
      .from('imported_articles')
      .delete()
      .eq('url', url);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, message: '文章已删除' });
  } catch (error: any) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: error.message || '删除失败' });
  }
}
