import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return res.status(500).json({ error: 'Server configuration error: GITHUB_CLIENT_ID not set' });
  }

  const redirectUri = (req.headers['x-forwarded-proto'] || 'https') + '://' + req.headers.host + '/api/callback';
  const scope = 'read:user';
  const authUrl = 'https://github.com/login/oauth/authorize?client_id=' + clientId + '&redirect_uri=' + encodeURIComponent(redirectUri) + '&scope=' + scope;

  return res.status(200).json({ url: authUrl });
}
