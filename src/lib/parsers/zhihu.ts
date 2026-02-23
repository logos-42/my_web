import axios from 'axios';
import type { ParsedArticle } from './index';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TIMEOUT = 15000;

function htmlToMarkdown(html: string): string {
  let markdown = html;
  
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  
  markdown = markdown.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi, '![$2]($1)\n\n');
  markdown = markdown.replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*\/?>/gi, '![$1]($2)\n\n');
  markdown = markdown.replace(/<img[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, '![]($1)\n\n');
  
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (_, content) => {
    const lines = content.replace(/<[^>]+>/g, '').trim().split('\n');
    return lines.map((line: string) => `> ${line.trim()}`).join('\n') + '\n\n';
  });
  
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gi, (_, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
    return items.map((item: string) => `- ${item.replace(/<[^>]+>/g, '').trim()}`).join('\n') + '\n\n';
  });
  
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gi, (_, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
    return items.map((item: string, i: number) => `${i + 1}. ${item.replace(/<[^>]+>/g, '').trim()}`).join('\n') + '\n\n';
  });
  
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
  markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n\n');
  
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  
  markdown = markdown.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  markdown = markdown.replace(/<hr\s*\/?>/gi, '\n---\n\n');
  
  markdown = markdown.replace(/<[^>]+>/g, '');
  
  markdown = markdown
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');

  return markdown;
}

function extractPostId(url: string): string {
  const match = url.match(/zhuanlan\.zhihu\.com\/p\/(\d+)/);
  if (!match) {
    throw new Error('无效的知乎专栏链接格式');
  }
  return match[1];
}

export async function parseZhihu(url: string): Promise<ParsedArticle> {
  const postId = extractPostId(url);
  const apiUrl = `https://zhuanlan.zhihu.com/api/posts/${postId}`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: TIMEOUT,
    });

    const data = response.data;

    if (!data.title) {
      throw new Error('无法解析文章标题');
    }

    const title = data.title;
    const content = htmlToMarkdown(data.content || '');
    const author = data.author?.name || data.author?.headline;
    
    let publishDate: string | undefined;
    if (data.created) {
      publishDate = new Date(data.created * 1000).toISOString().split('T')[0];
    } else if (data.updated) {
      publishDate = new Date(data.updated * 1000).toISOString().split('T')[0];
    }

    const coverImage = data.titleImage || data.thumbnail || undefined;

    const tags: string[] = [];
    if (data.topics && Array.isArray(data.topics)) {
      data.topics.forEach((topic: { name?: string }) => {
        if (topic.name) tags.push(topic.name);
      });
    }

    return {
      title,
      content,
      author,
      publishDate,
      source: '知乎专栏',
      sourceUrl: url,
      coverImage,
      tags: tags.length > 0 ? tags : undefined,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请稍后重试');
      }
      if (error.response?.status === 404) {
        throw new Error('文章不存在或已被删除');
      }
      if (error.response?.status === 403) {
        throw new Error('无权访问该文章');
      }
      throw new Error(`请求失败: ${error.message}`);
    }
    throw error;
  }
}
