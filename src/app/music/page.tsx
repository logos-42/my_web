import { getArticlesByCategory } from '@/app/data/articles';
import ArticleList from '@/components/ArticleList/ArticleList';
import Sidebar from '@/components/Sidebar/Sidebar';

export default function MusicPage() {
  const articles = getArticlesByCategory('music');

  return (
    <div className="layout">
      <Sidebar />
      
      <main className="content">
        <h1>音乐</h1>
        <p className="intro">
          这里是我的音乐作品和创作心得。
        </p>
        
        <ArticleList articles={articles} />
      </main>
    </div>
  );
}
