
import { getArticlesByCategory, getAllCategories } from '@/app/data/articles';
import ArticleList from '@/components/ArticleList/ArticleList';
import Sidebar from '@/components/Sidebar/Sidebar';
import { notFound } from 'next/navigation';


interface CategoryPageProps {
  params: {
    category: string;
  };
}

export async function generateStaticParams() {
  const categories = getAllCategories();
  
  return categories.map((category) => ({
    category: category,
  }));
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const articles = getArticlesByCategory(params.category);

  if (articles.length === 0) {
    notFound();
  }

  const categoryNames: Record<string, string> = {
    articles: '文章',
    philosophy: '哲科',
    music: '音乐',
    blogs: '博客',
    projects: '新奇项目',
  };

  return (
    <div className="layout">
      <Sidebar />
      
      <main className="content">
        <h1>{categoryNames[params.category] || params.category}</h1>
        <p className="intro">
          这里展示我的{categoryNames[params.category] || params.category}内容。
        </p>
        
        <ArticleList articles={articles} />
      </main>
    </div>
  );
}
