import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = await supabase
      .from('imported_articles')
      .select('*')
      .order('imported_at', { ascending: false });
    
    const urls: Record<string, any> = {};
    if (data) {
      for (const article of data) {
        urls[article.url] = {
          title: article.title,
          importedAt: article.imported_at,
          path: article.category
        };
      }
    }
    return res.status(200).json({ urls });
  } catch (error) {
    console.error('Failed to get imported articles:', error);
    return res.status(200).json({ urls: {} });
  }
}
