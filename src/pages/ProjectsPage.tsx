import { useState, useEffect } from 'react';
import { getArticlesByCategory, Article } from '@/data/articles';
import { useImportedArticles } from '@/hooks/useImportedArticles';
import ArticleList from '@/components/ArticleList/ArticleList';
import SEO from '@/components/SEO/SEO';

export default function ProjectsPage() {
  const staticArticles = getArticlesByCategory('projects');
  const { articles: importedArticles, loading } = useImportedArticles();
  const [combinedArticles, setCombinedArticles] = useState<Article[]>([]);

  useEffect(() => {
    const categoryImported = importedArticles
      .filter(imp => (imp.category || 'imported') === 'projects')
      .map(imp => ({
        slug: encodeURIComponent(imp.url),
        title: imp.title,
        date: imp.importedAt,
        category: 'projects',
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
        title="新奇项目"
        description="这里展示我的创新项目和实验性作品。"
      />
      <div className="projects-page">
        <h1>新奇项目</h1>
        <p className="intro">
          这里展示我的创新项目和实验性作品。
        </p>

        {loading ? <p>加载中...</p> : <ArticleList articles={combinedArticles} />}
      </div>
    </>
  );
}
