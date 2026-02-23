import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
}

interface ImportedArticle {
  title: string;
  importedAt: string;
  path: string;
}

type ImportedUrls = Record<string, ImportedArticle>;

const API_BASE = '/api';

export default function AdminPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('blog');
  const [categories, setCategories] = useState<Category[]>([]);
  const [importedArticles, setImportedArticles] = useState<ImportedUrls>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchCategories();
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      fetchImportedArticles(savedToken);
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchImportedArticles = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/imported`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setImportedArticles(data.urls || {});
      }
    } catch (error) {
      console.error('Failed to fetch imported articles:', error);
    }
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      setMessage({ type: 'error', text: '请输入密码' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem('admin_token', data.token);
        fetchImportedArticles(data.token);
        setMessage({ type: 'success', text: '登录成功' });
      } else {
        setMessage({ type: 'error', text: data.error || '登录失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken(null);
    localStorage.removeItem('admin_token');
    setPassword('');
    setMessage(null);
  };

  const handleImport = async () => {
    if (!url.trim()) {
      setMessage({ type: 'error', text: '请输入文章链接' });
      return;
    }

    if (!token) {
      setMessage({ type: 'error', text: '请先登录' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url, category }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `导入成功: ${data.article?.title}` });
        setUrl('');
        fetchImportedArticles(token);
      } else {
        setMessage({ type: 'error', text: data.error || '导入失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-box">
          <h1>管理员登录</h1>
          <p className="admin-subtitle">请输入密码以访问内容导入功能</p>
          <div className="admin-form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="输入密码"
              className="admin-input"
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="admin-btn admin-btn-primary"
          >
            {loading ? '登录中...' : '登录'}
          </button>
          {message && (
            <p className={`admin-message admin-message-${message.type}`}>
              {message.text}
            </p>
          )}
          <button
            onClick={() => navigate('/')}
            className="admin-btn admin-btn-link"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <header className="admin-header">
        <h1>内容导入管理</h1>
        <button onClick={handleLogout} className="admin-btn admin-btn-secondary">
          退出登录
        </button>
      </header>

      <main className="admin-main">
        <section className="admin-import-section">
          <h2>导入新文章</h2>
          <div className="admin-form-group">
            <label>文章链接</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="支持：微信公众号、知乎、Paragraph、Substack"
              className="admin-input"
            />
          </div>
          <div className="admin-form-group">
            <label>分类选择</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="admin-select"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleImport}
            disabled={loading}
            className="admin-btn admin-btn-primary"
          >
            {loading ? '导入中...' : '导入文章'}
          </button>
          {message && (
            <p className={`admin-message admin-message-${message.type}`}>
              {message.text}
            </p>
          )}
        </section>

        <section className="admin-imported-section">
          <h2>已导入文章 ({Object.keys(importedArticles).length})</h2>
          {Object.keys(importedArticles).length === 0 ? (
            <p className="admin-empty">暂无已导入的文章</p>
          ) : (
            <ul className="admin-imported-list">
              {Object.entries(importedArticles).map(([articleUrl, article]) => (
                <li key={articleUrl} className="admin-imported-item">
                  <span className="admin-imported-title">{article.title}</span>
                  <span className="admin-imported-date">
                    {formatDate(article.importedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="admin-footer">
        <button onClick={() => navigate('/')} className="admin-btn admin-btn-link">
          返回首页
        </button>
      </footer>
    </div>
  );
}
