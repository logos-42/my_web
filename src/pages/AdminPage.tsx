import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';

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
  category: string;
}

type ImportedUrls = Record<string, ImportedArticle>;

const API_BASE = '/api';

// 备用分类列表（当 API 不可用时使用）
const FALLBACK_CATEGORIES = [
  { id: 'blog', name: '博客' },
  { id: 'essays', name: '随笔' },
  { id: 'projects', name: '项目' },
  { id: 'podcast', name: '播客' },
  { id: 'philosophy', name: '哲科' },
  { id: 'music', name: '音乐' },
  { id: 'art', name: '绘画' },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('blog');
  const [filterCategory, setFilterCategory] = useState<string>('all');
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

  // 登录成功后加载已导入文章
  useEffect(() => {
    if (user) {
      fetchImportedArticles();
    }
  }, [user]);

  const checkAuth = async () => {
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
      console.log('Fetching categories from:', `${API_BASE}/categories`);
      const res = await fetch(`${API_BASE}/categories`);
      console.log('Categories response status:', res.status);
      const data = await res.json();
      console.log('Categories response:', data);
      console.log('Categories list:', data.categories);
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      } else {
        console.log('API 返回空分类，使用备用列表');
        setCategories(FALLBACK_CATEGORIES);
      }
    } catch (error) {
      console.error('Failed to fetch categories, using fallback:', error);
      setCategories(FALLBACK_CATEGORIES);
    }
  };

  const fetchImportedArticles = async () => {
    try {
      const res = await fetch(`${API_BASE}/imported`);
      const data = await res.json();
      console.log('Imported articles response:', data);
      if (res.ok) {
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

  const handleDelete = async (articleUrl: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return;
    
    try {
      const res = await fetch(`${API_BASE}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: articleUrl }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: '文章已删除' });
        fetchImportedArticles();
      } else {
        setMessage({ type: 'error', text: data.error || '删除失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误' });
    }
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
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button onClick={toggleTheme} className="admin-theme-toggle" title={theme === 'dark' ? '夜间模式' : '日间模式'}>
              <img 
                src={theme === 'dark' ? '/images/night.png' : '/images/day.png'} 
                alt={theme === 'dark' ? '夜间' : '日间'}
                style={{ width: '18px', height: '18px' }}
              />
            </button>
            <button onClick={() => navigate('/')} className="admin-btn admin-btn-link">
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <header className="admin-header">
        <h1>内容导入管理</h1>
        <div className="admin-header-right">
          <button onClick={toggleTheme} className="admin-theme-toggle" title={theme === 'dark' ? '夜间模式' : '日间模式'}>
            <img 
              src={theme === 'dark' ? '/images/night.png' : '/images/day.png'} 
              alt={theme === 'dark' ? '夜间' : '日间'}
              style={{ width: '18px', height: '18px' }}
            />
          </button>
          <div className="admin-user-info">
            <img src={user.avatar_url} alt={user.login} className="admin-avatar" />
            <span className="admin-username">{user.login}</span>
            <button onClick={handleLogout} className="admin-btn admin-btn-secondary">
              退出
            </button>
          </div>
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
          <div className="admin-section-header">
            <h2>已导入文章</h2>
            <div className="admin-filter-group">
              <label>栏目筛选：</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="admin-select"
                style={{ width: 'auto', display: 'inline-block', marginLeft: '8px' }}
              >
                <option value="all">全部栏目</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(() => {
            const filteredArticles = filterCategory === 'all'
              ? importedArticles
              : Object.fromEntries(
                  Object.entries(importedArticles).filter(([_, article]) => article.category === filterCategory)
                );
            const count = Object.keys(filteredArticles).length;

            if (count === 0) {
              return <p className="admin-empty">暂无已导入的文章{filterCategory !== 'all' ? `（${categories.find(c => c.id === filterCategory)?.name}）` : ''}</p>;
            }

            return (
              <ul className="admin-imported-list">
                {Object.entries(filteredArticles).map(([articleUrl, article]) => (
                  <li key={articleUrl} className="admin-imported-item">
                    <span className="admin-imported-title">{article.title}</span>
                    <span className="admin-imported-meta">
                      <span className="admin-imported-category">{categories.find(c => c.id === article.category)?.name || article.category}</span>
                      <span className="admin-imported-date">{formatDate(article.importedAt)}</span>
                    </span>
                    {user && (
                      <button
                        onClick={() => handleDelete(articleUrl)}
                        className="admin-btn admin-btn-danger"
                        style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '12px' }}
                      >
                        删除
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            );
          })()}
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
