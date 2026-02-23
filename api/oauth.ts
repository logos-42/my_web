import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { api: { externalResolver: true } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  if (!clientId) {
    return res.status(500).json({ error: 'GitHub OAuth 未配置' });
  }

  const state = Math.random().toString(36).substring(7);
  
  res.setHeader('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  
  const redirectUri = encodeURIComponent(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/callback`);
  const scope = 'read:user';
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
  
  res.redirect(authUrl);
}
