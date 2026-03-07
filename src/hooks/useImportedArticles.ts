import { useState, useEffect, useCallback } from 'react';

export interface ImportedArticle {
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

export function useImportedArticles() {
  const [articles, setArticles] = useState<ImportedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(() => {
    setLoading(true);
    fetch('/api/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return { articles, loading, refresh: fetchArticles };
}
