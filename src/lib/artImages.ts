/**
 * 艺术品图片管理模块
 * 支持从 API 获取图片与文章的绑定关系
 * 未绑定的图片将随机显示
 */

const TOTAL_IMAGES = 1000;
const API_BASE = '/api';

// 本地缓存的绑定关系
let cachedBindings: Record<number, string> = {};
let bindingsLoaded = false;

/**
 * 从 API 加载图片绑定关系
 */
export async function loadImageBindings(): Promise<Record<number, string>> {
  if (bindingsLoaded) {
    return cachedBindings;
  }

  try {
    const res = await fetch(`${API_BASE}/image-bindings`);
    if (res.ok) {
      const data = await res.json();
      const bindings: Record<number, string> = {};
      
      // 建立图片编号到文章 URL 的映射
      for (const binding of data.bindings || []) {
        bindings[binding.imageNumber] = binding.articleUrl;
      }
      
      cachedBindings = bindings;
      bindingsLoaded = true;
      return bindings;
    }
  } catch (error) {
    console.error('Failed to load image bindings:', error);
  }
  
  return {};
}

/**
 * 清除绑定缓存（用于 admin 操作后刷新）
 */
export function clearBindingsCache() {
  cachedBindings = {};
  bindingsLoaded = false;
}

/**
 * 获取图片绑定的文章 URL
 */
export function getBoundArticleUrl(imageNumber: number): string | undefined {
  return cachedBindings[imageNumber];
}

/**
 * 检查图片是否已绑定
 */
export function isImageBound(imageNumber: number): boolean {
  return !!cachedBindings[imageNumber];
}

/**
 * 获取未绑定的图片编号列表
 */
export function getUnboundImages(allImages: number[]): number[] {
  return allImages.filter(num => !cachedBindings[num]);
}

/**
 * 根据文章 URL 获取绑定的图片编号
 */
export function getImageNumberForArticle(articleUrl: string): number | null {
  for (const [imageNum, url] of Object.entries(cachedBindings)) {
    if (url === articleUrl) {
      return parseInt(imageNum, 10);
    }
  }
  return null;
}

/**
 * 获取文章使用的艺术品图片路径
 * 如果文章绑定了图片，使用绑定的图片；否则返回 null（表示随机）
 */
export function getArtImageForArticle(articleUrl: string): string | null {
  const imageNumber = getImageNumberForArticle(articleUrl);
  if (imageNumber !== null) {
    return `/finish/thumbnail_${imageNumber}.jpg`;
  }
  return null;
}

/**
 * 为未绑定的文章随机分配图片
 * 确保同一篇文章每次访问都使用相同的随机图片
 */
export function getRandomArtImageForArticle(articleUrl: string): string {
  // 使用 URL 生成固定的随机数
  let hash = 0;
  for (let i = 0; i < articleUrl.length; i++) {
    const char = articleUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // 从未绑定的图片中选择一个
  const unboundImages = getUnboundImages(Array.from({ length: TOTAL_IMAGES }, (_, i) => i + 1));
  
  if (unboundImages.length === 0) {
    // 如果所有图片都绑定了，使用 hash 随机选择一个
    const index = Math.abs(hash) % TOTAL_IMAGES + 1;
    return `/finish/thumbnail_${index}.jpg`;
  }
  
  const index = Math.abs(hash) % unboundImages.length;
  return `/finish/thumbnail_${unboundImages[index]}.jpg`;
}

/**
 * 替换文章内容中的微信图片为艺术品图片
 * 优先使用绑定的图片，如果没有绑定则随机分配
 */
export function replaceWechatImages(content: string, articleUrl: string): string {
  // 移除所有 Markdown 图片语法
  let processed = content.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

  // 移除所有 HTML img 标签
  processed = processed.replace(/<img[^>]*>/g, '');

  // 获取图片：优先绑定，其次随机
  const artImage = getArtImageForArticle(articleUrl) || getRandomArtImageForArticle(articleUrl);
  processed = `![artwork](${artImage})\n\n` + processed;

  return processed;
}

/**
 * 获取 Gallery 组件使用的图片列表
 * 返回包含绑定信息的图片数组
 */
export async function getGalleryImages(): Promise<Array<{
  number: number;
  path: string;
  boundArticleUrl?: string;
  isBound: boolean;
}>> {
  await loadImageBindings();
  
  const images = Array.from({ length: TOTAL_IMAGES }, (_, i) => i + 1).map(number => ({
    number,
    path: `/finish/thumbnail_${number}.jpg`,
    boundArticleUrl: cachedBindings[number],
    isBound: !!cachedBindings[number]
  }));
  
  return images;
}
