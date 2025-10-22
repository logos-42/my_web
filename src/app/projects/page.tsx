import { getArticlesByCategory } from '@/app/data/articles';
import ArticleList from '@/components/ArticleList/ArticleList';
import Sidebar from '@/components/Sidebar/Sidebar';

export default function ProjectsPage() {
  const articles = getArticlesByCategory('projects');

  return (
    <div className="layout">
      <Sidebar />
      
      <main className="content">
        <h1>新奇项目</h1>
        <p className="intro">
          这里展示我的创新项目和实验性作品。
        </p>
        
        <ArticleList articles={articles} />
      </main>
    </div>
  );
}
