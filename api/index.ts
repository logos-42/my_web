import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import crypto from 'crypto';
import { getImportedArticles, isUrlImported, saveArticle, getArticleByUrl } from './lib/db.js';
import { parseArticle, detectPlatform } from './lib/parsers.js';
import { getDatabaseProvider, getDatabaseProviderLabel } from './lib/config.js';

// ==================== 常量定义 ====================

const CATEGORIES = [
  { id: 'blog', name: '博客' },
  { id: 'essays', name: '随笔' },
  { id: 'projects', name: '项目' },
  { id: 'podcast', name: '播客' },
  { id: 'philosophy', name: '哲科' },
  { id: 'music', name: '音乐' },
  { id: 'art', name: '绘画' },
  { id: 'imported', name: '导入文章' }
];

// ==================== 工具函数 ====================

/**
 * 设置 CORS 头
 */
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * 从请求中获取用户信息
 */
function getUserFromRequest(req: VercelRequest): { login: string; id?: string; avatar_url?: string; name?: string } | null {
  try {
    // 优先从 Authorization header 获取
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const userInfo = JSON.parse(decoded);
      const adminGithubId = process.env.ADMIN_GITHUB_ID;
      if (userInfo.login !== adminGithubId) {
        return null;
      }
      return { login: userInfo.login, id: userInfo.id, avatar_url: userInfo.avatar_url, name: userInfo.name };
    }

    // 从 cookie 获取
    const cookies = req.headers.cookie;
    if (!cookies) return null;

    const userMatch = cookies.match(/user=([^;]+)/);
    if (!userMatch) return null;

    const userInfo = JSON.parse(Buffer.from(userMatch[1], 'base64').toString());
    const adminGithubId = process.env.ADMIN_GITHUB_ID;

    if (userInfo.login !== adminGithubId) {
      return null;
    }

    return { login: userInfo.login, id: userInfo.id, avatar_url: userInfo.avatar_url, name: userInfo.name };
  } catch {
    return null;
  }
}

/**
 * 格式化文章数据
 */
function formatArticle(url: string, article: any) {
  return {
    url,
    title: article.title,
    content: article.content,
    source: article.source,
    sourceUrl: article.source_url,
    author: article.author,
    publishDate: article.publish_date,
    coverImage: article.cover_image,
    tags: article.tags,
    category: article.category,
    importedAt: article.imported_at
  };
}

// ==================== 处理器函数 ====================

/**
 * 处理 OAuth 登录请求
 */
async function handleOAuth(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return res.status(500).json({ error: 'GitHub OAuth 未配置' });
  }

  const state = Math.random().toString(36).substring(7);
  res.setHeader('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

  const redirectUri = encodeURIComponent(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/callback`);
  const scope = 'read:user';

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

  res.redirect(authUrl);
}

/**
 * 处理 OAuth 回调请求
 */
async function handleCallback(req: VercelRequest, res: VercelResponse) {
  const { code, state, json } = req.query;
  const returnJson = json === 'true';
  const cookieState = req.cookies?.oauth_state;

  if (!returnJson && (!state || state !== cookieState)) {
    return res.redirect('/admin?error=invalid_state');
  }
  if (!code) {
    if (returnJson) {
      return res.status(400).json({ error: 'No code provided' });
    }
    return res.redirect('/admin?error=no_code');
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const adminGithubId = process.env.ADMIN_GITHUB_ID;

  if (!clientId || !clientSecret) {
    if (returnJson) {
      return res.status(500).json({ error: 'OAuth not configured' });
    }
    return res.redirect('/admin?error=oauth_not_configured');
  }

  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code: code as string,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      if (returnJson) {
        return res.status(400).json({ error: 'No access token received' });
      }
      return res.redirect('/admin?error=no_token');
    }

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { login, id, avatar_url, name } = userResponse.data;
    if (login !== adminGithubId) {
      if (returnJson) {
        return res.status(403).json({ error: 'User not authorized' });
      }
      return res.redirect('/admin?error=unauthorized');
    }

    const sessionToken = crypto
      .createHash('sha256')
      .update(`${login}:${accessToken}:${Date.now()}`)
      .digest('hex');

    const userInfo = JSON.stringify({ login, id, avatar_url, name, accessToken });
    const encodedUser = Buffer.from(userInfo).toString('base64');

    res.setHeader('Set-Cookie', [
      `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
      `user=${encodedUser}; Path=/; SameSite=Lax; Max-Age=86400`
    ]);

    if (returnJson) {
      return res.status(200).json({
        token: sessionToken,
        user: { login, id, avatar_url, name },
      });
    }
    res.redirect('/admin?login=success');
  } catch (error: any) {
    console.error('OAuth callback error:', error.message);
    if (returnJson) {
      return res.status(500).json({ error: 'OAuth failed' });
    }
    res.redirect('/admin?error=oauth_failed');
  }
}

/**
 * 处理用户信息请求
 */
async function handleMe(req: VercelRequest, res: VercelResponse) {
  const userInfo = getUserFromRequest(req);

  if (!userInfo) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: true,
    user: {
      login: userInfo.login,
      avatar_url: userInfo.avatar_url,
      name: userInfo.name,
    },
  });
}

/**
 * 处理登出请求
 */
async function handleLogout(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Set-Cookie', [
    'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    'user=; Path=/; SameSite=Lax; Max-Age=0'
  ]);
  res.redirect('/admin');
}

/**
 * 处理分类列表请求
 */
async function handleCategories(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ categories: CATEGORIES });
}

/**
 * 处理文章列表请求
 */
async function handleArticles(req: VercelRequest, res: VercelResponse) {
  try {
    const articles = await getImportedArticles();
    const category = req.query.category as string | undefined;

    let articlesList = Object.entries(articles).map(([url, article]) =>
      formatArticle(url, article)
    );

    if (category) {
      articlesList = articlesList.filter(a => a.category === category);
    }

    articlesList.sort((a, b) =>
      new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    );

    return res.status(200).json({
      articles: articlesList,
      provider: getDatabaseProviderLabel(),
      databaseProvider: getDatabaseProvider()
    });
  } catch (error) {
    console.error('Failed to get articles:', error);
    return res.status(200).json({
      articles: [],
      provider: getDatabaseProviderLabel(),
      databaseProvider: getDatabaseProvider()
    });
  }
}

/**
 * 处理单篇文章请求
 */
async function handleArticle(req: VercelRequest, res: VercelResponse) {
  const url = req.query.url as string;

  if (!url) {
    return res.status(400).json({ error: '缺少 URL 参数' });
  }

  try {
    const article = await getArticleByUrl(url);

    if (!article) {
      return res.status(404).json({ error: '文章不存在' });
    }

    return res.status(200).json({
      article: formatArticle(url, article),
      provider: getDatabaseProviderLabel(),
      databaseProvider: getDatabaseProvider()
    });
  } catch (error) {
    console.error('Failed to get article:', error);
    return res.status(500).json({ error: '获取文章失败' });
  }
}

/**
 * 处理已导入文章列表请求
 */
async function handleImported(req: VercelRequest, res: VercelResponse) {
  try {
    const articles = await getImportedArticles();

    const urls: Record<string, { title: string; importedAt: string; category: string }> = {};

    for (const [url, article] of Object.entries(articles)) {
      urls[url] = {
        title: article.title,
        importedAt: article.imported_at,
        category: article.category
      };
    }

    return res.status(200).json({
      urls,
      provider: getDatabaseProviderLabel(),
      databaseProvider: getDatabaseProvider()
    });
  } catch (error) {
    console.error('Failed to get imported articles:', error);
    return res.status(200).json({ urls: {}, provider: getDatabaseProviderLabel(), databaseProvider: getDatabaseProvider() });
  }
}

/**
 * 处理导入文章请求
 */
async function handleImport(req: VercelRequest, res: VercelResponse) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: '请先登录' });
  }

  const { url, category } = req.body;

  if (!url) {
    return res.status(400).json({ error: '缺少 URL 参数' });
  }

  // 默认分类为 blog
  const targetCategory = category || 'blog';

  try {
    const platform = detectPlatform(url);
    if (!platform) {
      return res.status(400).json({ error: '不支持的平台，支持：微信公众号、知乎、Paragraph、Substack' });
    }

    const alreadyImported = await isUrlImported(url);
    if (alreadyImported) {
      return res.status(400).json({ error: '该文章已导入过' });
    }

    const article = await parseArticle(url);
    const result = await saveArticle({
      url: article.sourceUrl,
      title: article.title,
      content: article.content,
      source: article.source,
      source_url: article.sourceUrl,
      author: article.author,
      publish_date: article.publishDate,
      cover_image: article.coverImage,
      tags: article.tags,
      category: targetCategory
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        article: {
          title: article.title,
          source: article.source
        },
        provider: getDatabaseProviderLabel(),
        databaseProvider: getDatabaseProvider(),
        message: `文章已导入成功！（存储：${getDatabaseProviderLabel()}）`
      });
    } else {
      return res.status(500).json({ error: result.error || '保存失败' });
    }
  } catch (error: any) {
    console.error('Import error:', error);
    return res.status(500).json({ error: error.message || '导入失败' });
  }
}

/**
 * 处理删除文章请求
 */
async function handleDelete(req: VercelRequest, res: VercelResponse) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: '请先登录' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: '缺少 URL 参数' });
  }

  try {
    // 根据数据库类型使用不同的删除方法
    const provider = getDatabaseProvider();
    
    if (provider === 'supabase') {
      const { supabase } = await import('./lib/supabase.js');
      const { error } = await supabase
        .from('imported_articles')
        .delete()
        .eq('url', url);

      if (error) {
        return res.status(500).json({ error: error.message });
      }
    } else if (provider === 'kv') {
      const { kv } = await import('@vercel/kv');
      const articles = await kv.get<Record<string, any>>('imported_articles') || {};
      delete articles[url];
      await kv.set('imported_articles', articles);
    } else if (provider === 'mysql') {
      const { getMySqlPool } = await import('./lib/config.js');
      const pool = getMySqlPool();
      if (!pool) {
        return res.status(500).json({ error: 'MySQL 未配置' });
      }
      await new Promise<void>((resolve, reject) => {
        pool.query('DELETE FROM imported_articles WHERE url = ?', [url], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } else if (provider === 'memory') {
      const { getImportedArticles } = await import('./lib/db.js');
      const articles = await getImportedArticles();
      delete articles[url];
    }

    return res.status(200).json({
      success: true,
      message: '文章已删除',
      provider: getDatabaseProviderLabel(),
      databaseProvider: getDatabaseProvider()
    });
  } catch (error: any) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: error.message || '删除失败' });
  }
}

// ==================== 主处理器 ====================

/**
 * 统一 API 入口
 * 路由规则:
 * - GET /api/oauth -> handleOAuth
 * - GET /api/callback -> handleCallback
 * - GET /api/me -> handleMe
 * - GET /api/logout -> handleLogout
 * - GET /api/categories -> handleCategories
 * - GET /api/articles -> handleArticles
 * - GET /api/articles?url=xxx -> handleArticle
 * - GET /api/imported -> handleImported
 * - POST /api/import -> handleImport
 * - POST /api/delete -> handleDelete
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.path || '';
  const normalizedPath = path.replace(/^\/api/, '').replace(/^\/+/, '');

  // OAuth 相关
  if (normalizedPath === 'oauth') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return handleOAuth(req, res);
  }

  if (normalizedPath === 'callback') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return handleCallback(req, res);
  }

  // 用户相关
  if (normalizedPath === 'me') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return handleMe(req, res);
  }

  if (normalizedPath === 'logout') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return handleLogout(req, res);
  }

  // 分类相关
  if (normalizedPath === 'categories') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return handleCategories(req, res);
  }

  // 文章相关
  if (normalizedPath === 'articles' || normalizedPath === '') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const url = req.query.url as string | undefined;
    if (url) {
      return handleArticle(req, res);
    }
    return handleArticles(req, res);
  }

  // 已导入文章
  if (normalizedPath === 'imported') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return handleImported(req, res);
  }

  // 导入文章
  if (normalizedPath === 'import') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return handleImport(req, res);
  }

  // 删除文章
  if (normalizedPath === 'delete') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return handleDelete(req, res);
  }

  // 未知路径
  return res.status(404).json({ error: 'Not found' });
}
