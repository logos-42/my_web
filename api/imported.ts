import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getImportedUrls } from './lib/github';

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = getUserFromCookie(req);
  if (!user) {
    return res.status(200).json({ urls: {} });
  }

  try {
    const urls = await getImportedUrls();
    return res.status(200).json({ urls });
  } catch (error: any) {
    return res.status(200).json({ urls: {} });
  }
}
