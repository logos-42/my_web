import { getArticlesByCategory } from '@/app/data/articles';
import ArticleList from '@/components/ArticleList/ArticleList';
import Sidebar from '@/components/Sidebar/Sidebar';

export default function BlogPage() {
  const articles = getArticlesByCategory('blogs');

  return (
    <div className="layout">
      <Sidebar />
      
      <main className="content">
        <h1>博客</h1>
        <p className="intro">
          这里是我的个人博客，记录日常思考和感悟。
        </p>
        
        <ArticleList articles={articles} />
      </main>
    </div>
  );
}
