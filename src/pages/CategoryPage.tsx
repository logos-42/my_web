import { useParams } from 'react-router-dom';
import { getArticlesByCategory } from '@/data/articles';
import ArticleList from '@/components/ArticleList/ArticleList';
import SEO from '@/components/SEO/SEO';

export default function CategoryPage() {
  const { category = '' } = useParams<{ category: string }>();
  const articles = getArticlesByCategory(category);

  const categoryNames: Record<string, string> = {
    articles: '文章',
    essays: '随笔',
    philosophy: '哲科',
    music: '音乐',
    blogs: '博客',
    projects: '新奇项目',
  };

  return (
    <>
      <SEO 
        title={categoryNames[category] || category}
        description={`这里展示我的${categoryNames[category] || category}内容。`}
      />
      <div className="category-page">
        <h1>{categoryNames[category] || category}</h1>
        <p className="intro">
          这里展示我的{categoryNames[category] || category}内容。
        </p>

        <ArticleList articles={articles} />
      </div>
    </>
  );
}
