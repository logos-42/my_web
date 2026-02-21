import { getAllArticles } from '@/data/articles';
import ArticleList from '@/components/ArticleList/ArticleList';
import SEO from '@/components/SEO/SEO';

export default function HomePage() {
  const articles = getAllArticles();

  return (
    <>
      <SEO 
        title="首页"
        description="欢迎来到我的个人网站，这里是我记录思考、分享知识的地方。"
        keywords="个人网站，博客，技术，艺术，哲学"
      />
      <div className="home-page">
        <div className="hero-section">
          <div className="hero-content">
            <div className="avatar-container">
              <img
                src="/images/liuyuanjie.png"
                alt="个人头像"
                className="avatar"
              />
            </div>
            <div className="hero-text">
              <h1>欢迎来到我的个人网站</h1>
              <p className="intro">
                这里是我记录思考、分享知识的地方。在这里，你可以找到我关于技术、艺术、哲学等多个领域的思考和创作。
              </p>
            </div>
          </div>
        </div>

        <div className="article-category-section">
          <h2>最新文章</h2>
          <ArticleList articles={articles} limit={10} />
        </div>

        <section className="backlinks">
          <h3>反向链接</h3>
          <ul id="backlinks-list"></ul>
        </section>
      </div>
    </>
  );
}
