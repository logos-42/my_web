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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = await supabase
      .from('imported_manifest')
      .select('data')
      .single();
    
    return res.status(200).json({ urls: data?.data?.urls || {} });
  } catch (error) {
    console.error('Failed to get imported articles:', error);
    return res.status(200).json({ urls: {} });
  }
}
