import { getAllArticles, getArticleBySlug, getArticlesByCategory } from '@/app/data/articles';

export default function DebugPage() {
  const allArticles = getAllArticles();
  const testArticle = getArticleBySlug('财富的本质', 'essays');
  const essaysArticles = getArticlesByCategory('essays');
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Information</h1>
      
      <h2>All Articles ({allArticles.length}):</h2>
      {allArticles.map((article, index) => (
        <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
          <strong>Category:</strong> {article.category}<br/>
          <strong>Slug:</strong> {article.slug}<br/>
          <strong>Title:</strong> {article.title}<br/>
          <strong>Date:</strong> {article.date.toString()}
        </div>
      ))}
      
      <h2>Test getArticleBySlug('财富的本质', 'essays'):</h2>
      <div style={{ padding: '10px', border: '1px solid #ccc' }}>
        {testArticle ? (
          <>
            <strong>Found:</strong> {testArticle.title}<br/>
            <strong>Category:</strong> {testArticle.category}<br/>
            <strong>Slug:</strong> {testArticle.slug}
          </>
        ) : (
          <strong>Not Found</strong>
        )}
      </div>
      
      <h2>Test getArticlesByCategory('essays') ({essaysArticles.length} articles):</h2>
      {essaysArticles.map((article, index) => (
        <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
          <strong>Category:</strong> {article.category}<br/>
          <strong>Slug:</strong> {article.slug}<br/>
          <strong>Title:</strong> {article.title}<br/>
          <strong>Date:</strong> {article.date.toString()}
        </div>
      ))}
    </div>
  );
}
