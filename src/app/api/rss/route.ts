import { getAllArticles } from '../../data/articles';

export async function GET() {
  try {
    const articles = getAllArticles();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.vercel.app';
    
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>我的个人网站</title>
    <description>这里是我记录思考、分享知识的地方。在这里，你可以找到我关于技术、艺术、哲学等多个领域的思考和创作。</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml"/>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    
    ${articles.map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <description><![CDATA[${article.excerpt || ''}]]></description>
      <link>${siteUrl}/${article.category}/${article.slug}</link>
      <guid>${siteUrl}/${article.category}/${article.slug}</guid>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
      <category>${article.category}</category>
    </item>
    `).join('')}
  </channel>
</rss>`;

    return new Response(rssXml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    return new Response('RSS feed generation failed', { status: 500 });
  }
}
