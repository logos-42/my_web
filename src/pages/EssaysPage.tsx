import { useState, useEffect } from 'react';
import { getArticlesByCategory, Article } from '@/data/articles';
import { useImportedArticles } from '@/hooks/useImportedArticles';
import ArticleList from '@/components/ArticleList/ArticleList';
import SEO from '@/components/SEO/SEO';

export default function EssaysPage() {
  const staticArticles = getArticlesByCategory('essays');
  const { articles: importedArticles, loading } = useImportedArticles();
  const [combinedArticles, setCombinedArticles] = useState<Article[]>([]);

  useEffect(() => {
    const categoryImported = importedArticles
      .filter(imp => (imp.category || 'imported') === 'essays')
      .map(imp => ({
        slug: encodeURIComponent(imp.url),
        title: imp.title,
        date: imp.importedAt,
        category: 'essays',
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
        title="随笔"
        description="这里是我关于生活、思考、感悟的随笔文章。"
      />
      <div className="essays-page">
        <h1>随笔</h1>
        <p className="intro">
          这里是我关于生活、思考、感悟的随笔文章。
        </p>

        {loading ? <p>加载中...</p> : <ArticleList articles={combinedArticles} />}
      </div>
    </>
  );
}
