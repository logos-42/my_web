import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { useImportedArticles, ImportedArticle } from '@/hooks/useImportedArticles';

const CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'blog', name: '博客' },
  { id: 'essays', name: '随笔' },
  { id: 'projects', name: '项目' },
  { id: 'podcast', name: '播客' },
  { id: 'philosophy', name: '哲科' },
  { id: 'music', name: '音乐' },
  { id: 'art', name: '绘画' },
  { id: 'imported', name: '导入文章' },
];

export default function ImportedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlParam = searchParams.get('url');
  const categoryParam = searchParams.get('category') || 'all';
  const { articles, loading, refresh } = useImportedArticles();
  const [selectedArticle, setSelectedArticle] = useState<ImportedArticle | null>(null);
  const [filteredCategory, setFilteredCategory] = useState(categoryParam);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // 检查管理员权限
  useEffect(() => {
    const cachedUser = localStorage.getItem('admin_user');
    if (cachedUser) {
      setIsAdmin(true);
    }
  }, []);

  // 过滤分类
  const filteredArticles = filteredCategory === 'all' 
    ? articles 
    : articles.filter(article => article.category === filteredCategory);

  useEffect(() => {
    if (urlParam && articles.length > 0) {
      const article = articles.find(a => encodeURIComponent(a.url) === urlParam);
      if (article) {
        setSelectedArticle(article);
      }
    }
  }, [urlParam, articles]);

  const handleCategoryChange = (category: string) => {
    setFilteredCategory(category);
    setSearchParams(prev => {
      if (category === 'all') {
        prev.delete('category');
      } else {
        prev.set('category', category);
      }
      return prev;
    });
  };

  const handleDelete = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这篇文章吗？')) return;
    
    setDeleting(url);
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        alert('文章已删除');
        refresh();
        // 如果当前查看的文章被删除了，返回列表
        if (selectedArticle?.url === url) {
          setSelectedArticle(null);
          navigate('/imported');
        }
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      alert('网络错误');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="imported-page">
        <h1>导入文章</h1>
        <p>加载中...</p>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <div className="imported-page">
        <button 
          onClick={() => {
            setSelectedArticle(null);
            navigate('/imported');
          }}
          className="back-button"
        >
          ← 返回列表
        </button>
        <article className="imported-article">
          <header>
            <h1>{selectedArticle.title}</h1>
            <div className="article-meta">
              {selectedArticle.author && <span>作者: {selectedArticle.author}</span>}
              {selectedArticle.publishDate && <span>发布日期: {formatDate(selectedArticle.publishDate)}</span>}
              <span>来源: {selectedArticle.source}</span>
              <span>分类: {CATEGORIES.find(c => c.id === selectedArticle.category)?.name || selectedArticle.category}</span>
              <span>导入时间: {formatDate(selectedArticle.importedAt)}</span>
            </div>
            {selectedArticle.coverImage && (
              <img src={selectedArticle.coverImage} alt={selectedArticle.title} className="cover-image" />
            )}
            {selectedArticle.tags && selectedArticle.tags.length > 0 && (
              <div className="tags">
                {selectedArticle.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </header>
          <div 
            className="article-content"
            dangerouslySetInnerHTML={{ __html: marked.parse(selectedArticle.content) as string }}
          />
          <footer>
            <a 
              href={selectedArticle.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="original-link"
            >
              查看原文 →
            </a>
          </footer>
        </article>
      </div>
    );
  }

  return (
    <div className="imported-page">
      <h1>导入文章</h1>
      <p className="intro">
        从其他平台导入的文章，无需重新部署，实时显示。
      </p>

      {/* 分类筛选 */}
      <div className="category-filter">
        <label>筛选分类：</label>
        <select 
          value={filteredCategory} 
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="category-select"
        >
          {CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {filteredArticles.length === 0 ? (
        <p className="empty">暂无导入的文章</p>
      ) : (
        <div className="articles-grid">
          {filteredArticles.map((article) => (
            <div 
              key={article.url} 
              className="article-card"
              onClick={() => {
                setSelectedArticle(article);
                navigate(`/imported?url=${encodeURIComponent(article.url)}`);
              }}
            >
              {article.coverImage && (
                <img src={article.coverImage} alt={article.title} className="card-cover" />
              )}
              <div className="card-content">
                <h2>{article.title}</h2>
                <div className="card-meta">
                  <span>{article.source}</span>
                  <span>{CATEGORIES.find(c => c.id === article.category)?.name || article.category}</span>
                  <span>{formatDate(article.importedAt)}</span>
                </div>
                <p className="card-excerpt">
                  {article.content.replace(/[#*`]/g, '').substring(0, 100)}...
                </p>
                {isAdmin && (
                  <button 
                    onClick={(e) => handleDelete(article.url, e)}
                    disabled={deleting === article.url}
                    className="delete-btn"
                    style={{ marginTop: '10px' }}
                  >
                    {deleting === article.url ? '删除中...' : '删除'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
