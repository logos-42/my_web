import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { api: { externalResolver: true } };

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Set-Cookie', [
    'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    'user=; Path=/; SameSite=Lax; Max-Age=0'
  ]);
  
  res.redirect('/admin');
}
