import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ParsedArticle {
  title: string;
  content: string;
  author?: string;
  publishDate?: string;
  source: string;
  sourceUrl: string;
  coverImage?: string;
  tags?: string[];
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TIMEOUT = 15000;

function htmlToMarkdownCheerio(html: string): string {
  const $ = cheerio.load(html);
  
  $('script, style, noscript').remove();
  
  let markdown = '';
  
  function processNode(el: unknown): void {
    const node = el as { type?: string; name?: string };
    if (node.type === 'text') {
      const text = $(el as cheerio.Element).text();
      if (text.trim()) markdown += text;
      return;
    }
    
    if (node.type !== 'tag') return;
    
    const tag = (el as cheerio.TagElement).name?.toLowerCase() || '';
    const $el = $(el as cheerio.Element);
    
    switch (tag) {
      case 'h1':
        markdown += `# ${$el.text().trim()}\n\n`;
        return;
      case 'h2':
        markdown += `## ${$el.text().trim()}\n\n`;
        return;
      case 'h3':
        markdown += `### ${$el.text().trim()}\n\n`;
        return;
      case 'h4':
        markdown += `#### ${$el.text().trim()}\n\n`;
        return;
      case 'h5':
        markdown += `##### ${$el.text().trim()}\n\n`;
        return;
      case 'h6':
        markdown += `###### ${$el.text().trim()}\n\n`;
        return;
      case 'p':
        $el.contents().each((_, child) => processNode(child));
        markdown += '\n\n';
        return;
      case 'img':
        const src = $el.attr('src') || $el.attr('data-src');
        const alt = $el.attr('alt') || '';
        if (src) markdown += `![${alt}](${src})\n\n`;
        return;
      case 'blockquote':
        const quoteText = $el.text().trim();
        quoteText.split('\n').forEach(line => {
          if (line.trim()) markdown += `> ${line.trim()}\n`;
        });
        markdown += '\n';
        return;
      case 'ul':
        $el.children('li').each((_, li) => {
          markdown += `- ${$(li).text().trim()}\n`;
        });
        markdown += '\n';
        return;
      case 'ol':
        $el.children('li').each((i, li) => {
          markdown += `${i + 1}. ${$(li).text().trim()}\n`;
        });
        markdown += '\n';
        return;
      case 'pre':
        const code = $el.find('code').text() || $el.text();
        const lang = $el.find('code').attr('class')?.match(/language-(\w+)/)?.[1] || '';
        markdown += `\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
        return;
      case 'code':
        const parent = $el.parent().get(0) as cheerio.TagElement | undefined;
        if (parent && parent.name !== 'pre') {
          markdown += `\`${$el.text()}\``;
        } else {
          markdown += $el.text();
        }
        return;
      case 'strong':
      case 'b':
        markdown += `**${$el.text()}**`;
        return;
      case 'em':
      case 'i':
        markdown += `*${$el.text()}*`;
        return;
      case 'a':
        const href = $el.attr('href');
        const linkText = $el.text();
        if (href && linkText) {
          markdown += `[${linkText}](${href})`;
        } else {
          markdown += linkText;
        }
        return;
      case 'br':
        markdown += '\n';
        return;
      case 'hr':
        markdown += '\n---\n\n';
        return;
      case 'figure':
        const figImg = $el.find('img').first();
        if (figImg.length) {
          const figSrc = figImg.attr('src');
          const figAlt = figImg.attr('alt') || $el.find('figcaption').text() || '';
          if (figSrc) {
            markdown += `![${figAlt}](${figSrc})\n\n`;
            return;
          }
        }
        $el.contents().each((_, child) => processNode(child));
        return;
      default:
        $el.contents().each((_, child) => processNode(child));
    }
  }
  
  $('body').contents().each((_, el) => processNode(el));
  
  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
}

function htmlToMarkdownRegex(html: string): string {
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

export interface Parser {
  name: string;
  patterns: RegExp[];
  parse: (url: string) => Promise<ParsedArticle>;
}

export function detectPlatform(url: string): Parser | null {
  const parsers: Parser[] = [
    { name: 'wechat', patterns: [/mp\.weixin\.qq\.com\/s\//], parse: parseWechat },
    { name: 'zhihu', patterns: [/zhuanlan\.zhihu\.com\/p\//], parse: parseZhihu },
    { name: 'paragraph', patterns: [/paragraph\.xyz\/@/], parse: parseParagraph },
    { name: 'substack', patterns: [/\.substack\.com\/p\//], parse: parseSubstack },
    { name: 'medium', patterns: [/medium\.com\/@|medium\.com\/[a-z0-9\-]+\/[a-z0-9\-]+/], parse: parseMedium },
  ];

  for (const parser of parsers) {
    for (const pattern of parser.patterns) {
      if (pattern.test(url)) {
        return parser;
      }
    }
  }
  return null;
}

export async function parseArticle(url: string): Promise<ParsedArticle> {
  const parser = detectPlatform(url);
  if (!parser) {
    throw new Error(`不支持的平台: ${url}`);
  }
  return parser.parse(url);
}

export async function parseWechat(url: string): Promise<ParsedArticle> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: TIMEOUT,
    });

    const $ = cheerio.load(response.data);

    const title = 
      $('#activity-name').text().trim() ||
      $('#rich_media_title').text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('title').text().trim();

    const author = 
      $('#js_name').text().trim() ||
      $('meta[name="author"]').attr('content') ||
      $('#js_author_name').text().trim();

    let publishDate = 
      $('#publish_time').text().trim() ||
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[name="publish_time"]').attr('content');
    
    if (publishDate && !publishDate.includes('-')) {
      publishDate = publishDate.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, '$1-$2-$3');
    }

    const coverImage = 
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content');

    const contentEl = $('#js_content');
    let content = '';
    
    if (contentEl.length) {
      content = htmlToMarkdownCheerio(contentEl.html() || '');
    } else {
      content = htmlToMarkdownCheerio($('body').html() || '');
    }

    const tags: string[] = [];
    $('meta[property="article:tag"]').each((_, el) => {
      const tag = $(el).attr('content');
      if (tag) tags.push(tag);
    });

    if (!title) {
      throw new Error('无法解析文章标题');
    }

    return {
      title,
      content,
      author,
      publishDate,
      source: '微信公众号',
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
      throw new Error(`请求失败: ${error.message}`);
    }
    throw error;
  }
}

export async function parseZhihu(url: string): Promise<ParsedArticle> {
  const match = url.match(/zhuanlan\.zhihu\.com\/p\/(\d+)/);
  if (!match) {
    throw new Error('无效的知乎专栏链接格式');
  }
  const postId = match[1];
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
    const content = htmlToMarkdownRegex(data.content || '');
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

function extractJsonLd($: ReturnType<typeof cheerio.load>): Record<string, unknown> | null {
  let jsonLd: Record<string, unknown> | null = null;
  
  try {
    const scripts = $('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      try {
        const content = $(scripts[i]).html();
        if (content) {
          const data = JSON.parse(content);
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Article' || item['@type'] === 'NewsArticle' || item['@type'] === 'BlogPosting') {
              jsonLd = item;
              return jsonLd;
            }
          }
        }
      } catch {
        // 忽略解析错误
      }
    }
  } catch {
    // 忽略错误
  }
  
  return jsonLd;
}

export async function parseParagraph(url: string): Promise<ParsedArticle> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: TIMEOUT,
    });

    const $ = cheerio.load(response.data);
    const jsonLd = extractJsonLd($);

    const title = 
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      (jsonLd?.headline as string) ||
      $('title').text().trim();

    const author = 
      $('meta[name="author"]').attr('content') ||
      $('[rel="author"]').text().trim() ||
      (jsonLd?.author as { name?: string })?.name ||
      undefined;

    let publishDate = 
      $('meta[property="article:published_time"]').attr('content') ||
      $('time[datetime]').attr('datetime') ||
      (jsonLd?.datePublished as string);
    
    if (publishDate) {
      publishDate = new Date(publishDate).toISOString().split('T')[0];
    }

    const coverImage = 
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      (jsonLd?.image as string) ||
      $('article img').first().attr('src') ||
      undefined;

    let contentHtml = '';
    const contentEl = $('article').first();
    if (contentEl.length) {
      contentHtml = contentEl.html() || '';
    } else {
      const mainEl = $('main').first();
      if (mainEl.length) {
        contentHtml = mainEl.html() || '';
      } else {
        const bodyEl = $('body');
        contentHtml = bodyEl.html() || '';
      }
    }

    const content = htmlToMarkdownCheerio(contentHtml);

    const tags: string[] = [];
    $('meta[property="article:tag"]').each((_, el) => {
      const tag = $(el).attr('content');
      if (tag) tags.push(tag);
    });
    $('a[rel="tag"]').each((_, el) => {
      const tag = $(el).text().trim();
      if (tag && !tags.includes(tag)) tags.push(tag);
    });

    if (!title) {
      throw new Error('无法解析文章标题');
    }

    return {
      title,
      content,
      author,
      publishDate,
      source: 'Paragraph',
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
      throw new Error(`请求失败: ${error.message}`);
    }
    throw error;
  }
}

export async function parseSubstack(url: string): Promise<ParsedArticle> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: TIMEOUT,
    });

    const $ = cheerio.load(response.data);
    const jsonLd = extractJsonLd($);

    const title = 
      $('meta[property="og:title"]').attr('content') ||
      $('h1.post-title').text().trim() ||
      $('h1').first().text().trim() ||
      (jsonLd?.headline as string) ||
      $('title').text().replace(' - Substack', '').trim();

    const author = 
      $('meta[name="author"]').attr('content') ||
      $('.author-name').text().trim() ||
      $('[class*="author"]').first().text().trim() ||
      ((jsonLd?.author as { name?: string })?.name) ||
      undefined;

    let publishDate = 
      $('.post-date').text().trim() ||
      $('meta[property="article:published_time"]').attr('content') ||
      $('time[datetime]').attr('datetime') ||
      (jsonLd?.datePublished as string);
    
    if (publishDate) {
      if (publishDate.includes(',') || !publishDate.includes('-')) {
        const parsed = new Date(publishDate);
        if (!isNaN(parsed.getTime())) {
          publishDate = parsed.toISOString().split('T')[0];
        }
      } else {
        publishDate = new Date(publishDate).toISOString().split('T')[0];
      }
    }

    let coverImage: string | undefined;
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && !ogImage.includes('substack.com/img/')) {
      coverImage = ogImage;
    } else {
      const jsonImage = jsonLd?.image;
      coverImage = Array.isArray(jsonImage) ? jsonImage[0] as string : jsonImage as string;
    }
    
    if (!coverImage) {
      const articleImg = $('article img, .post-content img').first();
      if (articleImg.length) {
        coverImage = articleImg.attr('src');
      }
    }

    let contentHtml = '';
    let contentEl = $('.post-content').first();
    if (!contentEl.length) {
      contentEl = $('article').first();
    }
    if (!contentEl.length) {
      contentEl = $('[class*="body"]').first();
    }
    if (!contentEl.length) {
      contentEl = $('main').first();
    }
    
    if (contentEl.length) {
      contentEl.find('script, style, noscript, .subscribe-widget, .share-dialog, nav, header, footer').remove();
      contentEl.find('[class*="subscribe"], [class*="share"], [class*="comment"]').remove();
      contentHtml = contentEl.html() || '';
    }

    const content = htmlToMarkdownCheerio(contentHtml);

    const tags: string[] = [];
    if (jsonLd?.keywords) {
      const keywords = Array.isArray(jsonLd.keywords) ? jsonLd.keywords : (jsonLd.keywords as string).split(',');
      keywords.forEach(tag => {
        const trimmed = typeof tag === 'string' ? tag.trim() : String(tag).trim();
        if (trimmed) tags.push(trimmed);
      });
    }
    $('a[class*="tag"], .post-tag').each((_, el) => {
      const tag = $(el).text().trim();
      if (tag && !tags.includes(tag)) tags.push(tag);
    });

    if (!title) {
      throw new Error('无法解析文章标题');
    }

    return {
      title,
      content,
      author,
      publishDate,
      source: 'Substack',
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
        throw new Error('该文章需要订阅才能查看');
      }
      throw new Error(`请求失败: ${error.message}`);
    }
    throw error;
  }
}

export async function parseMedium(url: string): Promise<ParsedArticle> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://medium.com/',
      },
      timeout: TIMEOUT,
    });

    const $ = cheerio.load(response.data);
    const jsonLd = extractJsonLd($);

    const title = 
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      (jsonLd?.headline as string) ||
      $('title').text().replace(' - Medium', '').trim();

    const author = 
      $('meta[property="article:author"]').attr('content') ||
      $('meta[name="author"]').attr('content') ||
      $('[rel="author"]').text().trim() ||
      ((jsonLd?.author as { name?: string })?.name) ||
      undefined;

    let publishDate = 
      $('meta[property="article:published_time"]').attr('content') ||
      $('time[datetime]').attr('datetime') ||
      (jsonLd?.datePublished as string);
    
    if (publishDate) {
      publishDate = new Date(publishDate).toISOString().split('T')[0];
    }

    const coverImage = 
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      (jsonLd?.image as string) ||
      undefined;

    let contentHtml = '';
    const articleEl = $('article').first();
    if (articleEl.length) {
      articleEl.find('script, style, noscript, [class*="subscription"], [class*="promo"], nav, header, footer').remove();
      contentHtml = articleEl.html() || '';
    } else {
      const mainEl = $('main').first();
      if (mainEl.length) {
        contentHtml = mainEl.html() || '';
      }
    }

    const content = htmlToMarkdownCheerio(contentHtml);

    if (!title) {
      throw new Error('无法解析文章标题');
    }

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
        throw new Error('请求超时，请稍后重试');
      }
      if (error.response?.status === 404) {
        throw new Error('文章不存在或已被删除');
      }
      if (error.response?.status === 403) {
        throw new Error('Medium拒绝访问，可能需要登录');
      }
      throw new Error(`请求失败: ${error.message}`);
    }
    throw error;
  }
}
