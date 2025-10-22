import { getArticlesByCategory } from '../data/articles';
import ArticleList from '../../components/ArticleList/ArticleList';
import Sidebar from '../../components/Sidebar/Sidebar';

export default function PhilosophyPage() {
  const articles = getArticlesByCategory('philosophy');

  return (
    <div className="layout">
      <Sidebar />
      
      <main className="content">
        <h1>哲科</h1>
        <p className="intro">
          这里是我关于哲学、科学、复杂系统的思考。
        </p>
        
        <ArticleList articles={articles} />
      </main>
    </div>
  );
}
