import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface User {
  id: string;
  login: string;
  avatar_url: string;
}

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
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('blog');
  const [categories, setCategories] = useState<Category[]>([]);
  const [importedArticles, setImportedArticles] = useState<ImportedUrls>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loginSuccess = searchParams.get("login");
    if (loginSuccess === "success") {
      setMessage({ type: "success", text: "登录成功" });
    }

    const errorParam = searchParams.get('error');
    if (errorParam) {
      setMessage({ type: 'error', text: decodeURIComponent(errorParam) });
    }
  }, [searchParams]);

  useEffect(() => {
    checkAuth();
    fetchCategories();
  }, []);

  const checkAuth = async () => {
    // Check localStorage for cached user info
    const cachedUser = localStorage.getItem("admin_user");
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        fetchImportedArticles();
        setCheckingAuth(false);
        return;
      } catch (e) {
        localStorage.removeItem("admin_user");
      }
    }
    try {
      const res = await fetch(`${API_BASE}/me`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("admin_user", JSON.stringify(data.user));
          fetchImportedArticles();
        }
      }
    } catch (error) {
      console.error('Failed to check auth:', error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchImportedArticles = async () => {
    try {
      const res = await fetch(`${API_BASE}/imported`);
      if (res.ok) {
        const data = await res.json();
        setImportedArticles(data.urls || {});
      }
    } catch (error) {
      console.error('Failed to fetch imported articles:', error);
    }
  };

const handleLogin = () => {
    window.location.href = `${API_BASE}/oauth`;
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_user");
    window.location.href = `${API_BASE}/logout`;
  };

  const handleImport = async () => {
    if (!url.trim()) {
      setMessage({ type: 'error', text: '请输入文章链接' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, category }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `导入成功: ${data.article?.title}` });
        setUrl('');
        fetchImportedArticles();
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

  if (checkingAuth) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-box">
          <p>检查登录状态...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-box">
          <h1>内容导入管理</h1>
          <button
            onClick={handleLogin}
            className="admin-btn admin-btn-primary admin-btn-github"
          >
            使用 GitHub 登录
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
        <div className="admin-user-info">
          <img src={user.avatar_url} alt={user.login} className="admin-avatar" />
          <span className="admin-username">{user.login}</span>
          <button onClick={handleLogout} className="admin-btn admin-btn-secondary">
            退出登录
          </button>
        </div>
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
