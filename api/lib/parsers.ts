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

/**
 * 将 HTML 转换为 Markdown（使用 Cheerio）
 */
function htmlToMarkdownCheerio(html: string, isWechat = false): string {
  const $ = cheerio.load(html);

  // 移除脚本、样式和无关元素
  $('script, style, noscript').remove();
  
  if (isWechat) {
    // 移除微信公众号特有的无关元素
    $('.js_empty, .js_placeholder, .rich_media_tool, .rich_media_media_list, .rich_media_opr, .rich_media_copyright, .rich_media_share, .rich_media_comment, .js_article_recommend, .wx_follow, .js_icon_like, .js_view_count, .js_like_text, .js_to_like, .js_share, .js_page_content, .js_copyright, .js_comment, .js_recommend, .js_empty_content, .js_media_info, .js_profile, .js_ad, .js_reward, .js_read_more, .js_history, .js_related, .js_more_article, .js_original_area').remove();
    
    // 移除包含特定文本的元素（微信 UI 元素）- 更精确的匹配
    $('*').each((_, el) => {
      const text = $(el).text().trim();
      const className = $(el).attr('class') || '';
      
      // 只移除纯 UI 元素，不移除可能包含内容的元素
      if (
        (text === '微信扫一扫' && className.includes('icon')) ||
        (text === '知道了' && className.includes('js')) ||
        (text === '取消' && className.includes('btn')) ||
        (text === '允许' && className.includes('btn')) ||
        (text.includes('轻触查看') && className.includes('tips')) ||
        (text.includes('向上滑动看') && className.includes('tips'))
      ) {
        $(el).remove();
      }
    });
  }

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
        const src = $el.attr('data-src') || $el.attr('src') || $el.attr('data-src-s');
        const alt = $el.attr('alt') || '';
        if (src) {
          // 过滤掉微信的头像和极小的 emoji 图标
          const isAvatar = src.includes('author') || src.includes('profile') || src.includes('wxhead');
          // 保留文章中的正常图片
          if (!isAvatar) {
            markdown += `![${alt}](${src})\n\n`;
          }
        }
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
        if (href && linkText && !href.startsWith('javascript:')) {
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

  let result = markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
  
  if (isWechat) {
    // 清理残留的微信 UI 文本（更精确的正则）
    result = result
      .replace(/\[知道了\]\(javascript:;\)\n?/g, '')
      .replace(/\[取消\]\(javascript:void\(0\);\)\n?/g, '')
      .replace(/\[允许\]\(javascript:void\(0\);\)\n?/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  
  return result;
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
    throw new Error(`不支持的平台：${url}`);
  }
  return parser.parse(url);
}

/**
 * 使用 Tavily API 解析微信公众号文章
 */
async function parseWechatWithTavily(url: string): Promise<ParsedArticle> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  if (!tavilyApiKey) {
    throw new Error('Tavily API key 未配置');
  }

  try {
    const response = await axios.post(
      'https://api.tavily.com/extract',
      {
        urls: [url],
        include_raw_html: true,
        skip_cache: false,
      },
      {
        headers: {
          'Authorization': `Bearer ${tavilyApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const data = response.data;

    if (!data.results || data.results.length === 0) {
      throw new Error('Tavily 返回空结果');
    }

    const result = data.results[0];
    const rawContent = result.raw_content || '';

    if (!rawContent.trim()) {
      throw new Error('Tavily 返回空内容');
    }

    // Tavily 返回的已经是 Markdown 格式
    let content = rawContent;

    // 清理微信公众号的 UI 元素
    content = content
      .replace(/!\[cover_image\]\([^)]*\)\n*/g, '') // 移除封面图标记
      .replace(/!\[跳转二维码\]\([^)]*\)\n*/g, '')
      .replace(/!\[作者头像\]\([^)]*\)\n*/g, '')
      .replace(/微信扫一扫\s*\n\s*关注该公众号\s*\n*/g, '')
      .replace(/!\[\]\([^)]*\)\n*/g, '') // 移除空 alt 的图片
      .replace(/微信扫一扫可打开此内容，\s*\n\s*使用完整服务\s*\n*/g, '')
      .replace(/:\s*，，，，，，，，，，，，\.\s*Video Mini Program.*$/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // 从 Markdown 中提取标题（第一个 # 标题）
    const titleMatch = content.match(/^#\s*(.+)$/m);
    let title = titleMatch ? titleMatch[1].trim() : '无标题';

    // 如果标题太短，尝试从 URL 或其他地方获取
    if (title.length < 5) {
      title = '微信公众号文章';
    }

    // 提取图片
    const images: string[] = [];
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      if (match[2] && !match[2].includes('wxhead') && !match[2].includes('author')) {
        images.push(match[2]);
      }
    }

    // 提取第一张非空图片作为封面
    const coverImage = images.length > 0 ? images[0] : undefined;

    // 移除 Markdown 图片语法中的空内容
    content = content.replace(/!\[\]\(\)\n*/g, '');

    if (!content || content.trim().length < 10) {
      throw new Error('Tavily 解析后内容太短');
    }

    return {
      title,
      content,
      author: undefined,
      publishDate: undefined,
      source: '微信公众号 (Tavily)',
      sourceUrl: url,
      coverImage,
      tags: undefined,
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Tavily API key 无效');
      }
      if (error.response?.status === 402) {
        throw new Error('Tavily API 配额已用尽');
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error('Tavily 请求超时');
      }
      throw new Error(`Tavily 请求失败：${error.message}`);
    }
    throw error;
  }
}

/**
 * 解析微信公众号文章（直接抓取 + Tavily 备选方案）
 */
export async function parseWechat(url: string): Promise<ParsedArticle> {
  let lastError: Error | null = null;

  // 尝试 1: 直接抓取
  try {
    console.log('[Wechat Parser] 尝试直接抓取...');
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: TIMEOUT,
      maxRedirects: 0,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 检查是否返回了验证页面
    const htmlContent = $.html();
    if (htmlContent.includes('环境异常') || htmlContent.includes('验证') || htmlContent.includes('captcha')) {
      console.log('[Wechat Parser] 检测到反爬虫验证，切换到 Tavily...');
      throw new Error('检测到反爬虫验证');
    }

    // 提取标题
    const title =
      $('#activity-name').text().trim() ||
      $('#rich_media_title').text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      $('title').text().trim();

    // 提取作者
    const author =
      $('#js_name').text().trim() ||
      $('meta[name="author"]').attr('content') ||
      $('#js_author_name').text().trim() ||
      $('.rich_media_meta_nickname').text().trim() ||
      undefined;

    // 提取发布时间
    let publishDate =
      $('#publish_time').text().trim() ||
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[name="publish_time"]').attr('content') ||
      $('.rich_media_meta_text').text().trim();

    if (publishDate && !publishDate.includes('-')) {
      publishDate = publishDate.replace(/(\d{4}) 年 (\d{1,2}) 月 (\d{1,2}) 日/, '$1-$2-$3');
    }

    // 提取封面图（可选）
    const coverImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      undefined;

    // 检查是否为纯音频/视频文章（没有 #js_content 元素）
    const jsContent = $('#js_content');
    if (jsContent.length === 0) {
      console.log('[Wechat Parser] 检测到纯音频/视频文章，切换到 Tavily...');
      throw new Error('纯音频/视频文章，需要备用 API 解析');
    }

    // 提取内容 - 尝试多种选择器
    let contentHtml = '';
    const contentSelectors = [
      '#js_content',
      '.rich_media_content',
      '#js_article',
      'article',
      '.content',
      'body',
    ];

    for (const selector of contentSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        contentHtml = el.html() || '';
        if (contentHtml.trim()) {
          break;
        }
      }
    }

    if (!contentHtml.trim()) {
      console.log('[Wechat Parser] 无法找到内容，切换到 Firecrawl...');
      throw new Error('无法找到文章内容');
    }

    // 转换为 Markdown（微信公众号特殊处理）
    const content = htmlToMarkdownCheerio(contentHtml, true);

    // 提取标签
    const tags: string[] = [];
    $('meta[property="article:tag"]').each((_, el) => {
      const tag = $(el).attr('content');
      if (tag) tags.push(tag);
    });

    if (!title || title.length < 1) {
      throw new Error('无法解析文章标题');
    }

    if (!content || content.trim().length < 10) {
      throw new Error('无法解析文章内容，内容太短');
    }

    console.log('[Wechat Parser] 直接抓取成功');
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
  } catch (error: any) {
    lastError = error;
    console.log('[Wechat Parser] 直接抓取失败:', error.message);

    // 如果是 Tavily 相关错误，直接抛出
    if (error.message?.includes('Tavily')) {
      throw error;
    }
  }

  // 尝试 2: 使用 Tavily
  console.log('[Wechat Parser] 准备尝试 Tavily...');
  try {
    console.log('[Wechat Parser] 使用 Tavily 作为备选方案...');
    const article = await parseWechatWithTavily(url);
    console.log('[Wechat Parser] Tavily 解析成功');
    return article;
  } catch (error: any) {
    console.log('[Wechat Parser] Tavily 也失败了:', error.message);

    // 如果 Tavily 失败，抛出原始错误
    if (lastError) {
      console.log('[Wechat Parser] 抛出原始错误:', lastError.message);
      throw lastError;
    }
    throw error;
  }
}

/**
 * 解析知乎专栏文章
 */
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
    const content = htmlToMarkdownCheerio(data.content || '');
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
      throw new Error(`请求失败：${error.message}`);
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

/**
 * 解析 Paragraph 文章
 */
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
      throw new Error(`请求失败：${error.message}`);
    }
    throw error;
  }
}

/**
 * 解析 Substack 文章
 */
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
      throw new Error(`请求失败：${error.message}`);
    }
    throw error;
  }
}

/**
 * 解析 Medium 文章
 */
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
        throw new Error('Medium 拒绝访问，可能需要登录');
      }
      throw new Error(`请求失败：${error.message}`);
    }
    throw error;
  }
}
