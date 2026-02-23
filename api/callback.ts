import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import crypto from 'crypto';

export const config = { api: { externalResolver: true } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, json } = req.query;
  const returnJson = json === 'true';
  const cookieState = req.cookies?.oauth_state;
  if (!returnJson && (!state || state !== cookieState)) {
    return res.redirect('/admin?error=invalid_state');
  }
  if (!code) {
    if (returnJson) {
      return res.status(400).json({ error: 'No code provided' });
    }
    return res.redirect('/admin?error=no_code');
  }
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const adminGithubId = process.env.ADMIN_GITHUB_ID;
  if (!clientId || !clientSecret) {
    if (returnJson) {
      return res.status(500).json({ error: 'OAuth not configured' });
    }
    return res.redirect('/admin?error=oauth_not_configured');
  }
  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code: code as string,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );
    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      if (returnJson) {
        return res.status(400).json({ error: 'No access token received' });
      }
      return res.redirect('/admin?error=no_token');
    }
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { login, id, avatar_url, name } = userResponse.data;
    if (login !== adminGithubId) {
      if (returnJson) {
        return res.status(403).json({ error: 'User not authorized' });
      }
      return res.redirect('/admin?error=unauthorized');
    }
    const sessionToken = crypto
      .createHash('sha256')
      .update(`${login}:${accessToken}:${Date.now()}`)
      .digest('hex');
    const userInfo = JSON.stringify({ login, id, avatar_url, name, accessToken });
    const encodedUser = Buffer.from(userInfo).toString('base64');
    res.setHeader('Set-Cookie', [
      `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
      `user=${encodedUser}; Path=/; SameSite=Lax; Max-Age=86400`
    ]);
    if (returnJson) {
      return res.status(200).json({
        token: sessionToken,
        user: { login, id, avatar_url, name },
      });
    }
    res.redirect('/admin?login=success');
  } catch (error: any) {
    console.error('OAuth callback error:', error.message);
    if (returnJson) {
      return res.status(500).json({ error: 'OAuth failed' });
    }
    res.redirect('/admin?error=oauth_failed');
  }
}
