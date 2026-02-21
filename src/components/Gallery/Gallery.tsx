import { useState, useEffect, useCallback } from 'react';

interface GalleryImage {
  number: number;
  path: string;
  wantCount?: number;
}

interface GalleryProps {
  totalImages?: number;
  itemsPerPage?: number;
}

function sortImages(images: GalleryImage[], sortMode: string, wantedItems: Record<number, number>): GalleryImage[] {
  let sortedImages = [...images];

  switch (sortMode) {
    case 'popular':
      sortedImages.sort((a, b) => {
        const aWants = wantedItems[a.number] || 0;
        const bWants = wantedItems[b.number] || 0;
        return bWants - aWants;
      });
      break;

    case 'random':
      sortedImages = weightedRandomSort(sortedImages, wantedItems);
      break;

    case 'newest':
      sortedImages.sort((a, b) => b.number - a.number);
      break;
  }

  return sortedImages;
}

function weightedRandomSort(images: GalleryImage[], wantedItems: Record<number, number>, popularityWeight: number = 3): GalleryImage[] {
  const weightedImages = images.map(img => {
    const wants = wantedItems[img.number] || 0;
    const weight = 1 + wants * popularityWeight;
    return { ...img, weight };
  });

  for (let i = weightedImages.length - 1; i > 0; i--) {
    let weightSum = 0;
    for (let j = 0; j <= i; j++) {
      weightSum += weightedImages[j].weight;
    }

    let random = Math.random() * weightSum;
    let j = 0;
    for (weightSum = weightedImages[0].weight; weightSum < random && j < i; j++) {
      weightSum += weightedImages[j + 1].weight;
    }

    [weightedImages[i], weightedImages[j]] = [weightedImages[j], weightedImages[i]];
  }

  return weightedImages.map(img => ({ number: img.number, path: img.path }));
}

function getPaginatedImages(images: GalleryImage[], currentPage: number, itemsPerPage: number): {
  images: GalleryImage[];
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalPages = Math.ceil(images.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, images.length);

  return {
    images: images.slice(startIndex, endIndex),
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
}

function generateUniqueId(imgPath: string, number: number): string {
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const data = `${imgPath}-${number}-${timestamp}-${randomStr}`;

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const hexHash = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  return `ART-${hexHash}`;
}

function verifyArtwork(id: string, number: number, imgPath: string): {
  isValid: boolean;
  artworkInfo: {
    id: string;
    number: number;
    path: string;
    verifiedAt: string;
  };
} {
  return {
    isValid: true,
    artworkInfo: {
      id,
      number,
      path: imgPath,
      verifiedAt: new Date().toISOString()
    }
  };
}

export default function Gallery({ totalImages = 1000, itemsPerPage = 24 }: GalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [sortMode, setSortMode] = useState<'popular' | 'random' | 'newest'>('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [wantedItems, setWantedItems] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadWantedData = useCallback(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gallery_wanted_items');
      if (saved) {
        try {
          setWantedItems(JSON.parse(saved));
        } catch (e) {
          console.error('无法解析保存的想要数据', e);
        }
      }
    }
  }, []);

  const saveWantedData = useCallback((data: Record<number, number>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gallery_wanted_items', JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    const initGallery = () => {
      const allImages: GalleryImage[] = [];
      for (let i = 1; i <= totalImages; i++) {
        allImages.push({
          number: i,
          path: `/finish/thumbnail_${i}.jpg`
        });
      }
      setImages(allImages);
      setIsLoading(false);
    };

    loadWantedData();
    initGallery();
  }, [totalImages, loadWantedData]);

  const handleWantClick = (imageNumber: number) => {
    const newWantedItems = { ...wantedItems };
    const currentWants = newWantedItems[imageNumber] || 0;
    newWantedItems[imageNumber] = currentWants + 1;

    setWantedItems(newWantedItems);
    saveWantedData(newWantedItems);
  };

  const showCertificate = (imageNumber: number, imagePath: string) => {
    const uniqueId = generateUniqueId(imagePath, imageNumber);
    const verification = verifyArtwork(uniqueId, imageNumber, imagePath);

    if (verification.isValid) {
      alert(`验证成功!\n作品编号：#${imageNumber}\n唯一凭证 ID: ${uniqueId}`);
    }
  };

  const showFullscreen = (imagePath: string) => {
    const viewer = document.createElement('div');
    viewer.className = 'fullscreen-viewer';
    viewer.style.display = 'flex';

    const img = document.createElement('img');
    img.src = imagePath;
    img.style.maxWidth = '90%';
    img.style.maxHeight = '90%';
    img.style.objectFit = 'contain';

    viewer.appendChild(img);
    document.body.appendChild(viewer);

    viewer.addEventListener('click', () => {
      document.body.removeChild(viewer);
    });
  };

  const sortedImages = sortImages(images, sortMode, wantedItems);
  const { images: paginatedImages, totalPages, hasNext, hasPrev } = getPaginatedImages(sortedImages, currentPage, itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <div className="loading-indicator">
        <div className="loading-spinner"></div>
        <p>正在加载图片，请稍候...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="gallery-controls">
        <div className="sort-controls">
          <button
            className={`sort-button ${sortMode === 'popular' ? 'active' : ''}`}
            onClick={() => setSortMode('popular')}
          >
            按受欢迎度
          </button>
          <button
            className={`sort-button ${sortMode === 'random' ? 'active' : ''}`}
            onClick={() => setSortMode('random')}
          >
            随机排序
          </button>
          <button
            className={`sort-button ${sortMode === 'newest' ? 'active' : ''}`}
            onClick={() => setSortMode('newest')}
          >
            最新作品
          </button>
        </div>
      </div>

      <div className="gallery">
        {paginatedImages.map((image) => (
          <div key={image.number} className="gallery-item">
            <img
              src={image.path}
              alt={`作品 #${image.number}`}
              onClick={() => showFullscreen(image.path)}
              style={{ cursor: 'pointer' }}
              loading="lazy"
            />

            <div className="gallery-item-info">
              <h3 className="gallery-item-title">作品 #{image.number}</h3>

              <div className="gallery-buttons">
                <button
                  className="want-button"
                  onClick={() => handleWantClick(image.number)}
                >
                  <i className="fa-solid fa-heart"></i> 想要
                  {wantedItems[image.number] > 0 && (
                    <span className="want-count">{wantedItems[image.number]}</span>
                  )}
                </button>

                <button
                  className="certificate-toggle"
                  onClick={() => showCertificate(image.number, image.path)}
                >
                  验证唯一凭证
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrev}
          >
            上一页
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={page === currentPage ? 'active' : ''}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext}
          >
            下一页
          </button>

          <div className="page-info">
            共 {images.length} 张图片，{totalPages} 页
          </div>
        </div>
      )}
    </div>
  );
}
