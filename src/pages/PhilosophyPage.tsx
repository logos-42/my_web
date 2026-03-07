import { useState, useEffect } from 'react';
import { getArticlesByCategory, Article } from '@/data/articles';
import { useImportedArticles } from '@/hooks/useImportedArticles';
import ArticleList from '@/components/ArticleList/ArticleList';
import SEO from '@/components/SEO/SEO';

export default function PhilosophyPage() {
  const staticArticles = getArticlesByCategory('philosophy');
  const { articles: importedArticles, loading } = useImportedArticles();
  const [combinedArticles, setCombinedArticles] = useState<Article[]>([]);

  useEffect(() => {
    const categoryImported = importedArticles
      .filter(imp => (imp.category || 'imported') === 'philosophy')
      .map(imp => ({
        slug: encodeURIComponent(imp.url),
        title: imp.title,
        date: imp.importedAt,
        category: 'philosophy',
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
        title="哲科"
        description="哲学思考与科学探索，探讨生命、宇宙与存在。"
      />
      <div className="philosophy-page">
        <h1>哲科</h1>
        <p className="intro">
          哲学思考与科学探索，探讨生命、宇宙与存在。
        </p>

        {loading ? <p>加载中...</p> : <ArticleList articles={combinedArticles} />}
      </div>
    </>
  );
}
