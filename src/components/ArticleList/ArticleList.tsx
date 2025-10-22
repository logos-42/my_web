import Link from 'next/link';
import { Article } from '@/app/data/articles';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ArticleListProps {
  articles: Article[];
  showCategory?: boolean;
  limit?: number;
}

export default function ArticleList({ articles, showCategory = false, limit }: ArticleListProps) {
  const displayArticles = limit ? articles.slice(0, limit) : articles;

  return (
    <div className="essays-list">
      {displayArticles.map((article) => (
        <div key={article.slug} className="essay-item">
          <Link 
            href={`/${article.category}/${article.slug}`}
            className="essay-title"
          >
            {article.title}
          </Link>
          <span className="essay-date">
            {format(new Date(article.date), 'yyyy-MM-dd', { locale: zhCN })}
          </span>
          {showCategory && (
            <span className="essay-category">{article.category}</span>
          )}
        </div>
      ))}
    </div>
  );
}
