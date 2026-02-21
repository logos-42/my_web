import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}

export default function SEO({ title, description, keywords, ogImage }: SEOProps) {
  useEffect(() => {
    const defaultTitle = '我的个人网站';
    const defaultDescription = '这里是我记录思考、分享知识的地方。在这里，你可以找到我关于技术、艺术、哲学等多个领域的思考和创作。';
    
    document.title = title ? `${title} - ${defaultTitle}` : defaultTitle;
    
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMeta('description', description || defaultDescription);
    updateMeta('keywords', keywords || '个人网站，博客，技术，艺术，哲学');
    updateMeta('og:title', title ? `${title} - ${defaultTitle}` : defaultTitle, true);
    updateMeta('og:description', description || defaultDescription, true);
    updateMeta('og:type', 'website', true);
    updateMeta('og:locale', 'zh_CN', true);
    
    if (ogImage) {
      updateMeta('og:image', ogImage, true);
    }

    return () => {
      document.title = defaultTitle;
    };
  }, [title, description, keywords, ogImage]);

  return null;
}
