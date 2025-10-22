import { getArticlesByCategory } from '@/app/data/articles';
import ArticleList from '@/components/ArticleList/ArticleList';
import Sidebar from '@/components/Sidebar/Sidebar';

export default function EssaysPage() {
  const articles = getArticlesByCategory('essays');

  return (
    <div className="layout">
      <Sidebar />
      
      <main className="content">
        <h1>随笔</h1>
        <p className="intro">
          这里是我关于生活、思考、感悟的随笔文章。
        </p>
        
        <ArticleList articles={articles} />
      </main>
    </div>
  );
}
