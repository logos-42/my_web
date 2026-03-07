import { useState, useEffect } from 'react';
import { getArticlesByCategory, Article } from '@/data/articles';
import { useImportedArticles } from '@/hooks/useImportedArticles';
import ArticleList from '@/components/ArticleList/ArticleList';
import SEO from '@/components/SEO/SEO';

export default function BlogPage() {
  const staticArticles = getArticlesByCategory('blogs');
  const { articles: importedArticles, loading } = useImportedArticles();
  const [combinedArticles, setCombinedArticles] = useState<Article[]>([]);

  useEffect(() => {
    const categoryImported = importedArticles
      .filter(imp => (imp.category || 'imported') === 'blogs')
      .map(imp => ({
        slug: encodeURIComponent(imp.url),
        title: imp.title,
        date: imp.importedAt,
        category: 'blogs',
        content: imp.content,
        excerpt: imp.content.substring(0, 200),
        htmlContent: imp.content,
        isImported: true,
        sourceUrl: imp.sourceUrl,
      } as Article));

    const merged = [...staticArticles, ...categoryImported];
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setCombinedArticles(merged);
  }, [staticArticles, importedArticles]);

  return (
    <>
      <SEO 
        title="博客"
        description="这里是我的个人博客，记录日常思考和感悟。"
      />
      <div className="blog-page">
        <h1>博客</h1>
        <p className="intro">
          这里是我的个人博客，记录日常思考和感悟。
        </p>

        {loading ? <p>加载中...</p> : <ArticleList articles={combinedArticles} />}
      </div>
    </>
  );
}
