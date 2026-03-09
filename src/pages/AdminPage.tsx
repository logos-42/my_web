import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import type { ImageBinding } from '@/lib/types';
import { clearBindingsCache, loadImageBindings } from '@/lib/artImages';

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

interface BindingWithArticle extends ImageBinding {
  articleCategory?: string;
}

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
  { id: 'imported', name: '导入' },
];

const TOTAL_IMAGES = 1000;

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
  
  // 图片绑定相关状态
  const [bindings, setBindings] = useState<BindingWithArticle[]>([]);
  const [bindImageNumber, setBindImageNumber] = useState<string>('');
  const [bindArticleUrl, setBindArticleUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'articles' | 'bindings'>('articles');
  const [bindingSearch, setBindingSearch] = useState<string>('');
  
  // 文章编辑相关状态
  const [editingArticleUrl, setEditingArticleUrl] = useState<string>('');
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [editLoading, setEditLoading] = useState(false);
  
  // 图片管理相关状态
  const [currentArticleIndex, setCurrentArticleIndex] = useState<number>(0);
  const [currentArticleList, setCurrentArticleList] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string>('');

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
      fetchBindings();
    }
  }, [user]);

  const checkAuth = async () => {
    const cachedUser = localStorage.getItem("admin_user");
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        fetchImportedArticles();
        fetchBindings();
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
          fetchBindings();
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

  const fetchBindings = async () => {
    try {
      const res = await fetch(`${API_BASE}/image-bindings`);
      const data = await res.json();
      if (res.ok) {
        // 为每个绑定查找对应的文章分类
        const bindingsWithCategory = data.bindings.map((binding: ImageBinding) => {
          const article = Object.entries(importedArticles).find(([url]) => url === binding.articleUrl);
          return {
            ...binding,
            articleCategory: article ? importedArticles[binding.articleUrl]?.category : undefined
          };
        });
        setBindings(bindingsWithCategory);
      }
    } catch (error) {
      console.error('Failed to fetch bindings:', error);
    }
  };

  const handleBind = async () => {
    if (!bindImageNumber.trim() || !bindArticleUrl.trim()) {
      setMessage({ type: 'error', text: '请填写图片编号和文章 URL' });
      return;
    }

    const imageNum = parseInt(bindImageNumber, 10);
    if (isNaN(imageNum) || imageNum < 1 || imageNum > TOTAL_IMAGES) {
      setMessage({ type: 'error', text: `图片编号必须在 1-${TOTAL_IMAGES} 之间` });
      return;
    }

    const articleTitle = Object.entries(importedArticles).find(([url]) => url === bindArticleUrl)?.[1]?.title || '';

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bind-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageNumber: imageNum,
          articleUrl: bindArticleUrl,
          articleTitle
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: '绑定成功' });
        setBindImageNumber('');
        setBindArticleUrl('');
        fetchBindings();
        clearBindingsCache();
      } else {
        setMessage({ type: 'error', text: data.error || '绑定失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnbind = async (imageNumber: number) => {
    if (!confirm('确定要解绑这张图片吗？')) return;

    try {
      const res = await fetch(`${API_BASE}/unbind-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageNumber }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: '解绑成功' });
        fetchBindings();
        clearBindingsCache();
      } else {
        setMessage({ type: 'error', text: data.error || '解绑失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误' });
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
        setMessage({ type: 'success', text: '文章已删除，绑定关系已自动解除' });
        fetchImportedArticles();
        fetchBindings();
        clearBindingsCache();
      } else {
        setMessage({ type: 'error', text: data.error || '删除失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误' });
    }
  };

  // 开始编辑文章
  const handleStartEdit = async (articleUrl: string) => {
    setEditingArticleUrl(articleUrl);
    const article = importedArticles[articleUrl];
    if (article) {
      setEditTitle(article.title);
      // 需要获取完整内容
      try {
        const res = await fetch(`${API_BASE}/articles?url=${encodeURIComponent(articleUrl)}`);
        const data = await res.json();
        if (data.article) {
          setEditContent(data.article.content || '');
        }
      } catch (error) {
        console.error('Failed to fetch article content:', error);
        setEditContent('');
      }
    }
  };

  // 保存文章编辑
  const handleSaveEdit = async () => {
    if (!editingArticleUrl) return;

    setEditLoading(true);
    try {
      const res = await fetch(`${API_BASE}/update-article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: editingArticleUrl,
          title: editTitle,
          content: editContent
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: '文章更新成功' });
        setEditingArticleUrl('');
        setEditTitle('');
        setEditContent('');
        fetchImportedArticles();
      } else {
        setMessage({ type: 'error', text: data.error || '更新失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setEditLoading(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingArticleUrl('');
    setEditTitle('');
    setEditContent('');
  };

  // 初始化文章列表用于图片管理
  useEffect(() => {
    const urls = Object.keys(importedArticles);
    setCurrentArticleList(urls);
    if (urls.length > 0) {
      updatePreviewImage(urls[0]);
    }
  }, [importedArticles]);

  // 更新预览图片
  const updatePreviewImage = (articleUrl: string) => {
    loadImageBindings().then(bindings => {
      // 检查是否有绑定
      const boundImage = Object.entries(bindings).find(([_, binding]) => binding.articleUrl === articleUrl);
      if (boundImage) {
        setPreviewImage(`/finish/thumbnail_${boundImage[0]}.jpg`);
      } else {
        // 随机图片（使用URL生成固定随机数）
        let hash = 0;
        for (let i = 0; i < articleUrl.length; i++) {
          const char = articleUrl.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        const index = (Math.abs(hash) % 1000) + 1;
        setPreviewImage(`/finish/thumbnail_${index}.jpg`);
      }
    });
  };

  // 刷新当前文章的随机图片
  const handleRefreshImage = () => {
    if (currentArticleList.length === 0) return;
    const articleUrl = currentArticleList[currentArticleIndex];
    
    // 先生成一个新的随机图片
    const newIndex = Math.floor(Math.random() * 1000) + 1;
    const newImage = `/finish/thumbnail_${newIndex}.jpg`;
    setPreviewImage(newImage);
  };

  // 上一篇文章
  const handlePrevArticle = () => {
    if (currentArticleList.length === 0) return;
    const newIndex = currentArticleIndex > 0 ? currentArticleIndex - 1 : currentArticleList.length - 1;
    setCurrentArticleIndex(newIndex);
    updatePreviewImage(currentArticleList[newIndex]);
  };

  // 下一篇文章
  const handleNextArticle = () => {
    if (currentArticleList.length === 0) return;
    const newIndex = currentArticleIndex < currentArticleList.length - 1 ? currentArticleIndex + 1 : 0;
    setCurrentArticleIndex(newIndex);
    updatePreviewImage(currentArticleList[newIndex]);
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

  // 过滤绑定列表
  const filteredBindings = bindingSearch
    ? bindings.filter(b => b.articleTitle.toLowerCase().includes(bindingSearch.toLowerCase()))
    : bindings;

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
        <div className="admin-header-left">
          <button onClick={() => navigate('/')} className="admin-btn admin-btn-link admin-home-link">
            首页
          </button>
        </div>
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
        {/* 标签页切换 */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => setActiveTab('articles')}
          >
            文章管理
          </button>
          <button
            className={`admin-tab ${activeTab === 'bindings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bindings')}
          >
            图片绑定管理
          </button>
        </div>

        {activeTab === 'articles' && (
          <>
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
                          <>
                            <button
                              onClick={() => handleStartEdit(articleUrl)}
                              className="admin-btn admin-btn-secondary"
                              style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '12px' }}
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDelete(articleUrl)}
                              className="admin-btn admin-btn-danger"
                              style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '12px' }}
                            >
                              删除
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </section>

            {/* 编辑文章弹窗 */}
            {editingArticleUrl && (
              <section className="admin-edit-section" style={{ marginTop: '20px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <h2>编辑文章</h2>
                <div className="admin-form-group">
                  <label>标题</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="admin-form-group">
                  <label>正文内容 (Markdown)</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="admin-textarea"
                    style={{ width: '100%', minHeight: '400px', fontFamily: 'monospace' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleSaveEdit}
                    disabled={editLoading}
                    className="admin-btn admin-btn-primary"
                  >
                    {editLoading ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="admin-btn admin-btn-secondary"
                  >
                    取消
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'bindings' && (
          <section className="admin-bindings-section">
            <h2>图片绑定管理</h2>
            <p className="admin-bindings-intro">
              将图片编号（1-{TOTAL_IMAGES}）与导入的文章进行绑定。未绑定的图片将随机显示。
            </p>

            {/* 绑定表单 */}
            <div className="admin-bind-form">
              <div className="admin-form-group">
                <label>图片编号</label>
                <input
                  type="number"
                  value={bindImageNumber}
                  onChange={(e) => setBindImageNumber(e.target.value)}
                  placeholder={`1-${TOTAL_IMAGES}`}
                  min="1"
                  max={TOTAL_IMAGES}
                  className="admin-input"
                  style={{ width: '150px' }}
                />
              </div>
              <div className="admin-form-group">
                <label>选择文章</label>
                <select
                  value={bindArticleUrl}
                  onChange={(e) => setBindArticleUrl(e.target.value)}
                  className="admin-select"
                  style={{ minWidth: '400px' }}
                >
                  <option value="">-- 请选择文章 --</option>
                  {Object.entries(importedArticles).map(([articleUrl, article]) => (
                    <option key={articleUrl} value={articleUrl}>
                      {article.title} ({categories.find(c => c.id === article.category)?.name || article.category})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleBind}
                disabled={loading || !bindImageNumber || !bindArticleUrl}
                className="admin-btn admin-btn-primary"
              >
                {loading ? '绑定中...' : '绑定'}
              </button>
            </div>

            {message && (
              <p className={`admin-message admin-message-${message.type}`}>
                {message.text}
              </p>
            )}

            {/* 图片管理工具 */}
            <div className="admin-image-manager" style={{ marginTop: '20px', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <h3>图片管理工具</h3>
              <p style={{ marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                预览当前文章将使用的图片，可通过按钮切换或刷新随机图片
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <button
                  onClick={handlePrevArticle}
                  disabled={currentArticleList.length === 0}
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  ← 上一個
                </button>
                
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    当前文章 ({currentArticleIndex + 1}/{currentArticleList.length}): 
                    <strong>{currentArticleList[currentArticleIndex] ? importedArticles[currentArticleList[currentArticleIndex]]?.title || '未知' : '无'}</strong>
                  </span>
                </div>
                
                <button
                  onClick={handleNextArticle}
                  disabled={currentArticleList.length === 0}
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  下一個 →
                </button>
                
                <button
                  onClick={handleRefreshImage}
                  disabled={currentArticleList.length === 0}
                  className="admin-btn admin-btn-primary"
                  style={{ padding: '8px 16px' }}
                >
                  🔄 刷新随机图片
                </button>
              </div>
              
              {/* 预览图片 */}
              {previewImage && (
                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                  <img 
                    src={previewImage} 
                    alt="预览图片" 
                    style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '8px', border: '2px solid var(--border-color)' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder.png';
                    }}
                  />
                  <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    图片路径: {previewImage}
                  </p>
                </div>
              )}
            </div>

            {/* 搜索过滤 */}
            <div className="admin-search-box" style={{ marginTop: '20px', marginBottom: '15px' }}>
              <input
                type="text"
                value={bindingSearch}
                onChange={(e) => setBindingSearch(e.target.value)}
                placeholder="搜索已绑定文章标题..."
                className="admin-input"
                style={{ width: '300px' }}
              />
              <span style={{ marginLeft: '10px', color: 'var(--text-secondary)' }}>
                共 {bindings.length} 个绑定
                {bindingSearch && `，筛选后 ${filteredBindings.length} 个`}
              </span>
            </div>

            {/* 绑定列表 */}
            <div className="admin-bindings-list">
              <h3>已绑定列表</h3>
              {filteredBindings.length === 0 ? (
                <p className="admin-empty">{bindingSearch ? '没有匹配的结果' : '暂无绑定的图片'}</p>
              ) : (
                <table className="admin-bindings-table">
                  <thead>
                    <tr>
                      <th>图片编号</th>
                      <th>预览</th>
                      <th>绑定文章</th>
                      <th>分类</th>
                      <th>绑定时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBindings.map((binding) => (
                      <tr key={binding.imageNumber}>
                        <td>#{binding.imageNumber}</td>
                        <td>
                          <img
                            src={`/finish/thumbnail_${binding.imageNumber}.jpg`}
                            alt={`作品 #${binding.imageNumber}`}
                            className="admin-binding-preview"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder.png';
                            }}
                          />
                        </td>
                        <td className="admin-binding-article">{binding.articleTitle}</td>
                        <td>
                          <span className="admin-binding-category">
                            {binding.articleCategory ? categories.find(c => c.id === binding.articleCategory)?.name || binding.articleCategory : '-'}
                          </span>
                        </td>
                        <td>{formatDate(binding.boundAt)}</td>
                        <td>
                          <button
                            onClick={() => handleUnbind(binding.imageNumber)}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            解绑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}
      </main>

    </div>
  );
}
