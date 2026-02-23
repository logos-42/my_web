import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getImportedUrls } from './lib/github';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    const urls = await getImportedUrls();
    return res.status(200).json({ urls });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
