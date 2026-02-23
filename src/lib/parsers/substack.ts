import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ParsedArticle } from './index';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TIMEOUT = 15000;

function htmlToMarkdown(html: string): string {
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
        const src = $el.attr('src');
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

interface SubstackJsonLd {
  '@type'?: string;
  headline?: string;
  author?: {
    name?: string;
  };
  datePublished?: string;
  dateModified?: string;
  image?: string | string[];
  keywords?: string | string[];
  articleBody?: string;
}

function extractJsonLd($: unknown): SubstackJsonLd | null {
  const _$ = $ as cheerio.CheerioAPI;
  let jsonLd: SubstackJsonLd | null = null;
  
  _$('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = _$(el).html();
      if (content) {
        const data = JSON.parse(content) as SubstackJsonLd | SubstackJsonLd[];
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'NewsArticle' || item['@type'] === 'Article' || item['@type'] === 'BlogPosting') {
            jsonLd = item;
            return false;
          }
        }
      }
    } catch {
      // 忽略解析错误
    }
    return true;
  });
  
  return jsonLd;
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
      (jsonLd?.headline) ||
      $('title').text().replace(' - Substack', '').trim();

    const author = 
      $('meta[name="author"]').attr('content') ||
      $('.author-name').text().trim() ||
      $('[class*="author"]').first().text().trim() ||
      (jsonLd?.author?.name) ||
      undefined;

    let publishDate = 
      $('.post-date').text().trim() ||
      $('meta[property="article:published_time"]').attr('content') ||
      $('time[datetime]').attr('datetime') ||
      (jsonLd?.datePublished);
    
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
      coverImage = Array.isArray(jsonImage) ? jsonImage[0] : jsonImage;
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

    const content = htmlToMarkdown(contentHtml);

    const tags: string[] = [];
    if (jsonLd?.keywords) {
      const keywords = Array.isArray(jsonLd.keywords) ? jsonLd.keywords : jsonLd.keywords.split(',');
      keywords.forEach(tag => {
        const trimmed = tag.trim();
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
