import Gallery from '@/components/Gallery/Gallery';
import SEO from '@/components/SEO/SEO';

export default function ArtPage() {
  return (
    <>
      <SEO 
        title="绘画作品集"
        description="这里展示我的绘画作品，每件作品都有唯一凭证，支持收藏和分享功能。"
      />
      <div className="art-page">
        <h1>绘画作品集</h1>
        <p className="intro">
          这里展示我的绘画作品，每件作品都有唯一凭证，支持收藏和分享功能。
        </p>

        <Gallery totalImages={1000} itemsPerPage={24} />
      </div>
    </>
  );
}
