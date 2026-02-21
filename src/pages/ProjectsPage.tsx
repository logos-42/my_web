import { getArticlesByCategory } from '@/data/articles';
import ArticleList from '@/components/ArticleList/ArticleList';
import SEO from '@/components/SEO/SEO';

export default function ProjectsPage() {
  const articles = getArticlesByCategory('projects');

  return (
    <>
      <SEO 
        title="新奇项目"
        description="这里展示我的创新项目和实验性作品。"
      />
      <div className="projects-page">
        <h1>新奇项目</h1>
        <p className="intro">
          这里展示我的创新项目和实验性作品。
        </p>

        <ArticleList articles={articles} />
      </div>
    </>
  );
}
