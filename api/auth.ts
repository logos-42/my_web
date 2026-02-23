import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (password === adminPassword) {
    const token = crypto
      .createHash('sha256')
      .update(`${adminPassword}:${Date.now()}`)
      .digest('hex');
    
    return res.status(200).json({ 
      success: true, 
      token,
      expiresIn: 86400
    });
  }

  return res.status(401).json({ success: false, error: '密码错误' });
}
