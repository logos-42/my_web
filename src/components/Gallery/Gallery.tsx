'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { GalleryImage, sortImages, getPaginatedImages, generateUniqueId, verifyArtwork } from '@/lib/gallery';
import { trackGalleryEvent } from '@/lib/analytics';

interface GalleryProps {
  totalImages?: number;
  itemsPerPage?: number;
}

export default function Gallery({ totalImages = 1000, itemsPerPage = 24 }: GalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [sortMode, setSortMode] = useState<'popular' | 'random' | 'newest'>('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [wantedItems, setWantedItems] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 加载"想要"数据
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

  // 保存"想要"数据
  const saveWantedData = useCallback((data: Record<number, number>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gallery_wanted_items', JSON.stringify(data));
    }
  }, []);

  // 初始化画廊
  useEffect(() => {
    const initGallery = () => {
      // 生成图片列表
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

  // 处理"想要"按钮点击
  const handleWantClick = (imageNumber: number) => {
    const newWantedItems = { ...wantedItems };
    const currentWants = newWantedItems[imageNumber] || 0;
    newWantedItems[imageNumber] = currentWants + 1;
    
    setWantedItems(newWantedItems);
    saveWantedData(newWantedItems);
    trackGalleryEvent('want_artwork', imageNumber);
  };

  // 显示唯一凭证
  const showCertificate = (imageNumber: number, imagePath: string) => {
    const uniqueId = generateUniqueId(imagePath, imageNumber);
    const verification = verifyArtwork(uniqueId, imageNumber, imagePath);
    
    if (verification.isValid) {
      alert(`验证成功!\n作品编号: #${imageNumber}\n唯一凭证ID: ${uniqueId}`);
      trackGalleryEvent('verify_artwork', imageNumber);
    }
  };

  // 全屏查看图片
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
    
    trackGalleryEvent('view_fullscreen');
  };

  // 排序处理
  const sortedImages = sortImages(images, sortMode, wantedItems);
  const { images: paginatedImages, totalPages, hasNext, hasPrev } = getPaginatedImages(sortedImages, currentPage, itemsPerPage);

  // 分页处理
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
      {/* 画廊控制 */}
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

      {/* 画廊网格 */}
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

      {/* 分页控件 */}
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
