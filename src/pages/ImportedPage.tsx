import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { useImportedArticles, ImportedArticle } from '@/hooks/useImportedArticles';
import { loadImageBindings, getArtImageForArticle, getRandomArtImageForArticle } from '@/lib/artImages';

const CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'blog', name: '博客' },
  { id: 'essays', name: '随笔' },
  { id: 'projects', name: '项目' },
  { id: 'podcast', name: '播客' },
  { id: 'philosophy', name: '哲科' },
  { id: 'music', name: '音乐' },
  { id: 'art', name: '绘画' },
];

export default function ImportedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlParam = searchParams.get('url');
  const categoryParam = searchParams.get('category') || 'all';
  const { articles, loading } = useImportedArticles();
  const [selectedArticle, setSelectedArticle] = useState<ImportedArticle | null>(null);
  const [filteredCategory, setFilteredCategory] = useState(categoryParam);
  const [processedContent, setProcessedContent] = useState<string>('');
  const [artImage, setArtImage] = useState<string>('');
  const [bindingsLoaded, setBindingsLoaded] = useState(false);

  // 加载图片绑定关系
  useEffect(() => {
    loadImageBindings().then(() => {
      setBindingsLoaded(true);
    });
  }, []);

  // 处理文章内容，替换微信图片为艺术品图片
  useEffect(() => {
    if (selectedArticle && bindingsLoaded) {
      // 移除所有 Markdown 图片语法
      let processed = selectedArticle.content.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
      // 移除所有 HTML img 标签
      processed = processed.replace(/<img[^>]*>/g, '');

      // 获取图片：优先绑定，其次随机
      const boundImage = getArtImageForArticle(selectedArticle.url);
      const randomImage = getRandomArtImageForArticle(selectedArticle.url);
      const finalImage = boundImage || randomImage;
      setArtImage(finalImage);

      // 在内容前添加艺术品图片
      processed = `![artwork](${finalImage})\n\n` + processed;
      setProcessedContent(processed);
    }
  }, [selectedArticle, bindingsLoaded]);

  // 判断是否是从列表页点击进入的详情页
  const isDetailView = !!urlParam;

  const handleBack = () => {
    if (isDetailView) {
      // 从列表页进入的详情页，返回列表页（去掉 URL 参数）
      setSearchParams(prev => {
        prev.delete('url');
        return prev;
      });
      setSelectedArticle(null);
    } else {
      // 直接从侧边栏或首页进入的详情页，返回首页
      navigate('/');
    }
  };

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
          onClick={handleBack}
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
            {/* 只显示艺术品图片作为封面 */}
            {artImage && (
              <img src={artImage} alt="封面图片" className="cover-image" />
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
            dangerouslySetInnerHTML={{ __html: marked.parse(processedContent || selectedArticle.content) as string }}
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
              {/* 列表也显示艺术品图片作为封面 */}
              <div className="card-cover" style={{ backgroundColor: '#f0f0f0', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#999' }}>点击查看</span>
              </div>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
