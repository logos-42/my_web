export interface Article {
  title: string;
  content: string;
  author?: string;
  date?: string;
  source: string;
  url: string;
}

export type Platform = 'wechat' | 'zhihu' | 'paragraph' | 'substack';

export function detectPlatform(url: string): Platform | null {
  if (url.includes('mp.weixin.qq.com')) return 'wechat';
  if (url.includes('zhuanlan.zhihu.com') || url.includes('zhihu.com')) return 'zhihu';
  if (url.includes('paragraph.xyz')) return 'paragraph';
  if (url.includes('substack.com')) return 'substack';
  return null;
}

export async function parseArticle(url: string): Promise<Article> {
  const platform = detectPlatform(url);
  
  if (!platform) {
    throw new Error('不支持的平台');
  }

  const response = await fetch(url);
  const html = await response.text();
  
  switch (platform) {
    case 'wechat':
      return parseWechat(html, url);
    case 'zhihu':
      return parseZhihu(html, url);
    case 'paragraph':
      return parseParagraph(html, url);
    case 'substack':
      return parseSubstack(html, url);
    default:
      throw new Error('不支持的平台');
  }
}

function parseWechat(html: string, url: string): Article {
  const titleMatch = html.match(/<h1[^>]*class="rich_media_title"[^>]*>([\s\S]*?)<\/h1>/);
  const contentMatch = html.match(/<div[^>]*id="js_content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
  const authorMatch = html.match(/<a[^>]*id="js_name"[^>]*>([\s\S]*?)<\/a>/);
  
  return {
    title: titleMatch ? titleMatch[1].trim() : '未知标题',
    content: contentMatch ? contentMatch[1].trim() : '',
    author: authorMatch ? authorMatch[1].trim() : undefined,
    source: '微信公众号',
    url
  };
}

function parseZhihu(html: string, url: string): Article {
  const titleMatch = html.match(/<h1[^>]*class="Post-Title"[^>]*>([\s\S]*?)<\/h1>/);
  const contentMatch = html.match(/<div[^>]*class="Post-RichText[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>)?\s*<\/div>/);
  const authorMatch = html.match(/<div[^>]*class="AuthorInfo-name"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
  
  return {
    title: titleMatch ? titleMatch[1].trim() : '未知标题',
    content: contentMatch ? contentMatch[1].trim() : '',
    author: authorMatch ? authorMatch[1].trim() : undefined,
    source: '知乎',
    url
  };
}

function parseParagraph(html: string, url: string): Article {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
  const authorMatch = html.match(/<div[^>]*class="author[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
  
  return {
    title: titleMatch ? titleMatch[1].trim() : '未知标题',
    content: contentMatch ? contentMatch[1].trim() : '',
    author: authorMatch ? authorMatch[1].trim() : undefined,
    source: 'Paragraph',
    url
  };
}

function parseSubstack(html: string, url: string): Article {
  const titleMatch = html.match(/<h1[^>]*class="post-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/);
  const contentMatch = html.match(/<div[^>]*class="body markup[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  const authorMatch = html.match(/<div[^>]*class="meta-author[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
  
  return {
    title: titleMatch ? titleMatch[1].trim() : '未知标题',
    content: contentMatch ? contentMatch[1].trim() : '',
    author: authorMatch ? authorMatch[1].trim() : undefined,
    source: 'Substack',
    url
  };
}
