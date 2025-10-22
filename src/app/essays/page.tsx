import { getArticlesByCategory } from '../../lib/markdown';
import ArticleList from '../../components/ArticleList/ArticleList';
import Sidebar from '../../components/Sidebar/Sidebar';

export default function EssaysPage() {
  const articles = getArticlesByCategory('articles');

  return (
    <div className="layout">
      <Sidebar />
      
      <main className="content">
        <h1>文章</h1>
        <p className="intro">
          这里是我关于技术、思考、生活的文章合集。
        </p>
        
        <ArticleList articles={articles} />
      </main>
    </div>
  );
}
