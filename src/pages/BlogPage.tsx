import { getArticlesByCategory } from '@/data/articles';
import ArticleList from '@/components/ArticleList/ArticleList';
import SEO from '@/components/SEO/SEO';

export default function BlogPage() {
  const articles = getArticlesByCategory('blogs');

  return (
    <>
      <SEO 
        title="博客"
        description="这里是我的个人博客，记录日常思考和感悟。"
      />
      <div className="blog-page">
        <h1>博客</h1>
        <p className="intro">
          这里是我的个人博客，记录日常思考和感悟。
        </p>

        <ArticleList articles={articles} />
      </div>
    </>
  );
}
