import { getAllArticles } from '@/app/data/articles';
import ArticleList from '@/components/ArticleList/ArticleList';
import Sidebar from '@/components/Sidebar/Sidebar';

export default function HomePage() {
  const articles = getAllArticles();

  return (
    <div className="home-page">
      <div className="layout">
        <Sidebar />
        
        <main className="content">
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
          

          <div className="links-section">
            <h2>我的其他平台</h2>
            <div className="links-grid">
              <div className="link-item">
                <h3>GitHub</h3>
                <p>我的代码仓库和开源项目</p>
                <a href="https://github.com/logos-42" target="_blank" rel="noopener noreferrer" className="platform-link">
                  @logos-42
                </a>
              </div>
              <div className="link-item">
                <h3>Firefly</h3>
                <p>去中心化社交网络</p>
                <a href="https://firefly.social/profile/lens/logos42" target="_blank" rel="noopener noreferrer" className="platform-link">
                  @logos42
                </a>
              </div>
              <div className="link-item">
                <h3>Twitter/X</h3>
                <p>日常思考和动态分享</p>
                <a href="https://x.com/canopylist" target="_blank" rel="noopener noreferrer" className="platform-link">
                  @canopylist
                </a>
              </div>
              <div className="link-item">
                <h3>paragraph</h3>
                <p>深度文章和Web3内容</p>
                <a href="https://paragraph.com/dashboard/@logos-42" target="_blank" rel="noopener noreferrer" className="platform-link">
                  查看我的paragraph
                </a>
              </div>
            </div>
          </div>

          <section className="subscribe-section">
            <h3>订阅更新</h3>
            <p>点击下方链接订阅最新文章推送</p>
            <a href="mailto:your-email@example.com?subject=订阅更新" className="subscribe-link">
              订阅最新文章
            </a>
          </section>

          <section className="backlinks">
            <h3>反向链接</h3>
            <ul id="backlinks-list"></ul>
          </section>
        </main>
      </div>
    </div>
  );
}
