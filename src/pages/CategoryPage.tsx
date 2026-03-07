import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getArticlesByCategory, Article } from '@/data/articles';
import { useImportedArticles } from '@/hooks/useImportedArticles';
import ArticleList from '@/components/ArticleList/ArticleList';
import SEO from '@/components/SEO/SEO';

export default function CategoryPage() {
  const { category = '' } = useParams<{ category: string }>();
  const staticArticles = getArticlesByCategory(category);
  const { articles: importedArticles, loading } = useImportedArticles();
  const [combinedArticles, setCombinedArticles] = useState<Article[]>([]);

  useEffect(() => {
    const categoryImported = importedArticles
      .filter(imp => (imp.category || 'imported') === category)
      .map(imp => ({
        slug: encodeURIComponent(imp.url),
        title: imp.title,
        date: imp.importedAt,
        category: category,
        content: imp.content,
        excerpt: imp.content.substring(0, 200),
        htmlContent: imp.content,
        isImported: true,
        sourceUrl: imp.sourceUrl,
      } as Article));

    const merged = [...staticArticles, ...categoryImported];
    merged.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setCombinedArticles(merged);
  }, [staticArticles, importedArticles, category]);

  const categoryNames: Record<string, string> = {
    articles: '文章',
    essays: '随笔',
    philosophy: '哲科',
    music: '音乐',
    blogs: '博客',
    projects: '新奇项目',
    imported: '导入文章',
  };

  return (
    <>
      <SEO 
        title={categoryNames[category] || category}
        description={`这里展示我的${categoryNames[category] || category}内容。`}
      />
      <div className="category-page">
        <h1>{categoryNames[category] || category}</h1>
        <p className="intro">
          这里展示我的{categoryNames[category] || category}内容。
        </p>

        {loading ? (
          <p>加载中...</p>
        ) : (
          <ArticleList articles={combinedArticles} />
        )}
      </div>
    </>
  );
}
