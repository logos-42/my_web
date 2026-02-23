import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { api: { externalResolver: true } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let userInfo = null;

  // Try Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Decode the token (base64 encoded user info)
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      userInfo = JSON.parse(decoded);
    } catch {
      return res.status(401).json({ authenticated: false, error: 'Invalid token' });
    }
  } else {
    // Fall back to cookie
    const userCookie = req.cookies?.user;
    if (!userCookie) {
      return res.status(401).json({ authenticated: false });
    }
    try {
      userInfo = JSON.parse(Buffer.from(userCookie, 'base64').toString());
    } catch {
      return res.status(401).json({ authenticated: false });
    }
  }

  const adminGithubId = process.env.ADMIN_GITHUB_ID;
  if (userInfo.login !== adminGithubId) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: true,
    user: {
      login: userInfo.login,
      avatar_url: userInfo.avatar_url,
      name: userInfo.name,
    },
  });
}
