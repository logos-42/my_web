import type { VercelRequest, VercelResponse } from '@vercel/node';

const CATEGORIES = [
  { id: 'blog', name: '博客' },
  { id: 'essays', name: '随笔' },
  { id: 'projects', name: '项目' },
  { id: 'podcast', name: '播客' },
  { id: 'philosophy', name: '哲科' },
  { id: 'music', name: '音乐' },
  { id: 'art', name: '绘画' },
  { id: 'imported', name: '导入文章' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({ categories: CATEGORIES });
}
