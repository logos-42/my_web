import { Link } from 'react-router-dom';
import { Article } from '@/data/articles';

interface ArticleListProps {
  articles: Article[];
  showCategory?: boolean;
  limit?: number;
}

export default function ArticleList({ articles, showCategory = false, limit }: ArticleListProps) {
  const displayArticles = limit ? articles.slice(0, limit) : articles;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="essays-list">
      {displayArticles.map((article) => (
        <div key={article.slug} className="essay-item">
          <Link
            to={`/${article.category}/${article.slug}`}
            className="essay-title"
          >
            {article.title}
          </Link>
          <span className="essay-date">
            {formatDate(article.date)}
          </span>
          {showCategory && (
            <span className="essay-category">{article.category}</span>
          )}
        </div>
      ))}
    </div>
  );
}
