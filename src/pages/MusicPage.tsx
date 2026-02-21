import { getArticlesByCategory } from '@/data/articles';
import ArticleList from '@/components/ArticleList/ArticleList';
import SEO from '@/components/SEO/SEO';

export default function MusicPage() {
  const articles = getArticlesByCategory('music');

  return (
    <>
      <SEO 
        title="音乐"
        description="这里是我的音乐作品和创作心得。"
      />
      <div className="music-page">
        <h1>音乐</h1>
        <p className="intro">
          这里是我的音乐作品和创作心得。
        </p>

        <ArticleList articles={articles} />
      </div>
    </>
  );
}
