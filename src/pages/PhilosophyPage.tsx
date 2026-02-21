import { getArticlesByCategory } from '@/data/articles';
import ArticleList from '@/components/ArticleList/ArticleList';
import SEO from '@/components/SEO/SEO';

export default function PhilosophyPage() {
  const articles = getArticlesByCategory('philosophy');

  return (
    <>
      <SEO 
        title="哲科"
        description="哲学思考与科学探索，探讨生命、宇宙与存在。"
      />
      <div className="philosophy-page">
        <h1>哲科</h1>
        <p className="intro">
          哲学思考与科学探索，探讨生命、宇宙与存在。
        </p>

        <ArticleList articles={articles} />
      </div>
    </>
  );
}
