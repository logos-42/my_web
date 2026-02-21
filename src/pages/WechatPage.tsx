import SEO from '@/components/SEO/SEO';

export default function WechatPage() {
  return (
    <>
      <SEO 
        title="公众号"
        description="关注我的公众号，获取最新的文章和思考。"
      />
      <div className="wechat-page">
        <h1>公众号</h1>

        <div className="wechat-content">
          <div className="qrcode-placeholder">
            <img src="/images/wechat-qrcode.jpg" alt="公众号二维码" width="200" height="200" />
          </div>

          <div className="wechat-info">
            <h2>关注我的公众号</h2>
            <ul>
              <li>获取最新的文章和思考</li>
              <li>参与深度讨论和交流</li>
              <li>第一时间了解我的创作动态</li>
              <li>获得独家的技术分享</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
