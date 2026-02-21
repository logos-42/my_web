import { useParams } from 'react-router-dom';
import { getArticleBySlug } from '@/data/articles';
import SEO from '@/components/SEO/SEO';

export default function ArticlePage() {
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
