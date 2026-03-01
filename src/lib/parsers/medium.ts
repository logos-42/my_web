import axios from 'axios';
import type { ParsedArticle } from './index';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TIMEOUT = 15000;

export async function parseMedium(url: string): Promise<ParsedArticle> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: TIMEOUT,
    });

    const html = response.data;
    
    // Basic parsing - extract title, author, and content from HTML
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Untitled';

    const authorMatch = html.match(/<a[^>]*href="\/([^"?]+)"[^>]*>([^<]+)<\/a>/);
    const author = authorMatch ? authorMatch[2].trim() : undefined;

    // Extract main article content
    const contentMatch = html.match(/<article[^>]*>(.*?)<\/article>/s);
    const content = extractContent(contentMatch ? contentMatch[1] : html);

    // Extract publish date
    const dateMatch = html.match(/<time[^>]*datetime="([^"]+)"/);
    const publishDate = dateMatch ? dateMatch[1].split('T')[0] : undefined;

    // Extract cover image
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
    const coverImage = imageMatch ? imageMatch[1] : undefined;

    return {
      title,
      content,
      author,
      publishDate,
      source: 'Medium',
      sourceUrl: url,
      coverImage,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout, please try again later');
      }
      if (error.response?.status === 404) {
        throw new Error('Article not found or has been deleted');
      }
      throw new Error(`Request failed: ${error.message}`);
    }
    throw error;
  }
}

function extractContent(html: string): string {
  let content = html;
  
  // Remove script and style tags
  content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Headers
  content = content.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  content = content.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  content = content.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  
  // Paragraphs
  content = content.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  
  // Links
  content = content.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Images
  content = content.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, '![]($1)\n\n');
  
  // Bold and italic
  content = content.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  content = content.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  content = content.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  content = content.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  
  // Code
  content = content.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
  content = content.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  
  // Lists
  content = content.replace(/<ul[^>]*>(.*?)<\/ul>/gi, (_, ul) => {
    return ul.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
  });
  content = content.replace(/<ol[^>]*>(.*?)<\/ol>/gi, (_, ol) => {
    let index = 1;
    return ol.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${index++}. $1\n`) + '\n';
  });
  
  // Blockquotes
  content = content.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (_, quote) => {
    const lines = quote.replace(/<[^>]+>/g, '').trim().split('\n');
    return lines.map((line: string) => `> ${line.trim()}`).join('\n') + '\n\n';
  });
  
  // Remove remaining HTML tags
  content = content.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  content = content
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Clean up whitespace
  content = content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');

  return content;
}
