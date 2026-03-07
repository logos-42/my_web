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
      .from('imported_manifest')
      .select('data')
      .single();
    
    return res.status(200).json({ urls: data?.data?.urls || {} });
  } catch (error) {
    console.error('Failed to get imported articles:', error);
    return res.status(200).json({ urls: {} });
  }
}
