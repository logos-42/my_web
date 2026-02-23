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
        markdown += `\`\`\`\n${code.trim()}\n\`\`\`\n\n`;
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
      default:
        $el.contents().each((_, child) => processNode(child));
    }
  }
  
  $('body').contents().each((_, el) => processNode(el));
  
  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
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
      content = htmlToMarkdown(contentEl.html() || '');
    } else {
      content = htmlToMarkdown($('body').html() || '');
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
