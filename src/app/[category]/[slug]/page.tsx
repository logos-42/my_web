
import { getArticleBySlug, getAllArticles } from '../../../lib/markdown';
import Sidebar from '../../../components/Sidebar/Sidebar';
import { notFound } from 'next/navigation';

interface ArticlePageProps {
  params: {
    category: string;
    slug: string;
  };
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  
  return articles.map((article) => ({
    category: article.category,
    slug: article.slug,
  }));
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const article = getArticleBySlug(params.slug, params.category);

  if (!article) {
    notFound();
  }

  return (
    <div className="layout">
      <Sidebar />
      
      <main className="content">
        <article>
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
      </main>
    </div>
  );
}
