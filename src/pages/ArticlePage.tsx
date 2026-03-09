import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticleBySlug } from '@/data/articles';
import SEO from '@/components/SEO/SEO';
import { marked } from 'marked';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  tags?: string[];
  htmlContent?: string;
  url?: string;
  source?: string;
}

export default function ArticlePage() {
  const navigate = useNavigate();
  const { category = '', slug = '' } = useParams<{ category: string; slug: string }>();
  const article = getArticleBySlug(slug, category);

  if (!article) {
    return (
      <div className="not-found">
        <h1>404</h1>
        <p>文章未找到</p>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={article.title}
        description={article.excerpt}
      />
      <article className="article-detail">
        <button onClick={() => navigate('/')} className="article-back-btn">
          ← 首页
        </button>
        <h1>{article.title}</h1>
        <div className="article-meta">
          <time>{new Date(article.date).toLocaleDateString('zh-CN')}</time>
          <span className="category">{article.category}</span>
        </div>

        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.htmlContent || '' }}
        />
      </article>
    </>
  );
}
