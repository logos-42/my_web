import { useState, useEffect } from 'react';
import { marked } from 'marked';

interface ImportedArticle {
  url: string;
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
  author?: string;
  publishDate?: string;
  coverImage?: string;
  tags?: string[];
  category: string;
  importedAt: string;
}

export default function ImportedPage() {
  const [articles, setArticles] = useState<ImportedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<ImportedArticle | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
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
          onClick={() => setSelectedArticle(null)}
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

      {articles.length === 0 ? (
        <p className="empty">暂无导入的文章</p>
      ) : (
        <div className="articles-grid">
          {articles.map((article) => (
            <div 
              key={article.url} 
              className="article-card"
              onClick={() => setSelectedArticle(article)}
            >
              {article.coverImage && (
                <img src={article.coverImage} alt={article.title} className="card-cover" />
              )}
              <div className="card-content">
                <h2>{article.title}</h2>
                <div className="card-meta">
                  <span>{article.source}</span>
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
