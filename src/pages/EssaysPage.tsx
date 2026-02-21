import { getArticlesByCategory } from '@/data/articles';
import ArticleList from '@/components/ArticleList/ArticleList';
import SEO from '@/components/SEO/SEO';

export default function EssaysPage() {
  const articles = getArticlesByCategory('essays');

  return (
    <>
      <SEO 
        title="随笔"
        description="这里是我关于生活、思考、感悟的随笔文章。"
      />
      <div className="essays-page">
        <h1>随笔</h1>
        <p className="intro">
          这里是我关于生活、思考、感悟的随笔文章。
        </p>

        <ArticleList articles={articles} />
      </div>
    </>
  );
}
