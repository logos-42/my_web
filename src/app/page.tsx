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
          <h1>欢迎来到我的个人网站</h1>
          <p className="intro">
            这里是我记录思考、分享知识的地方。在这里，你可以找到我关于技术、艺术、哲学等多个领域的思考和创作。
          </p>
          
          <div className="article-category-section">
            <h2>最新文章</h2>
            <ArticleList articles={articles} limit={10} />
          </div>
          
          <div className="social-section">
            <h2>关注我</h2>
            <div className="social-content">
              <div className="social-item">
                <h3>公众号</h3>
                <div className="qrcode">
                  <img src="/images/wechat-qrcode.jpg" alt="公众号二维码" width="200" height="200" />
                </div>
              </div>
              <div className="social-item">
                <h3>知识星球</h3>
                <div className="qrcode">
                  <img src="/images/zsxq-qrcode.jpg" alt="知识星球二维码" width="200" height="200" />
                </div>
              </div>
            </div>
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
                <h3>Mirror</h3>
                <p>深度文章和Web3内容</p>
                <a href="https://mirror.xyz/0xb4e9dCF79055A8232670ebb1c8c664Dff4E70066" target="_blank" rel="noopener noreferrer" className="platform-link">
                  查看我的Mirror
                </a>
              </div>
            </div>
          </div>

          <section className="backlinks">
            <h3>反向链接</h3>
            <ul id="backlinks-list"></ul>
          </section>
        </main>
      </div>
    </div>
  );
}
