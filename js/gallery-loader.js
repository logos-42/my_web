/**
 * 画廊图片自动加载脚本
 * 自动扫描finish文件夹中的图片并显示在画廊中
 * 支持分页加载和外部图床
 */

// 配置对象
const config = {
    // 文件来源配置
    sourceType: 'local',  // 'local' 或 'remote'
    folderPath: 'finish',  // 本地图片文件夹路径
    
    // 远程图床配置 (当sourceType为'remote'时使用)
    remoteCDN: {
        enabled: false,
        baseUrl: 'https://yourdomain.com/images/',  // 替换为你的远程图床URL
        fileList: []  // 可以在这里手动添加文件名列表，或者通过API获取
    },
    
    // 文件命名配置
    filePrefix: 'thumbnail_',  // 文件名前缀
    fileExt: '.jpg',  // 文件扩展名
    
    // 画廊配置
    gallerySelector: '.gallery',  // 画廊容器选择器
    maxAttempts: 2500,  // 最大尝试次数 (提高到2500以适应更多图片)
    startFrom: 1,  // 起始编号
    
    // 分页配置
    pagination: {
        enabled: true,  // 启用分页
        itemsPerPage: 24,  // 每页显示的图片数量
        currentPage: 1,  // 当前页码
        paginationSelector: '.pagination'  // 分页控件选择器
    },
    
    // 性能配置
    batchSize: 10,  // 每批加载的图片数量
    delay: 10  // 批次间延迟（毫秒）(减少延迟提高加载速度)
};

// 全局变量
let allImagePaths = [];  // 存储所有找到的图片路径
let totalImages = 0;  // 图片总数

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 获取画廊容器
    const gallery = document.querySelector(config.gallerySelector);
    if (!gallery) {
        console.error('找不到画廊容器元素');
        return;
    }
    
    // 清空画廊容器
    gallery.innerHTML = '';
    
    // 添加加载指示器
    addLoadingIndicator(gallery);
    
    // 添加全屏查看器
    addFullscreenViewer();
    
    // 根据来源类型加载图片
    if (config.sourceType === 'remote' && config.remoteCDN.enabled) {
        loadRemoteImages();
    } else {
        // 开始加载图片
        scanLocalImages();
    }
});

/**
 * 添加加载指示器
 * @param {HTMLElement} container - 容器元素
 */
function addLoadingIndicator(container) {
    const loading = document.createElement('div');
    loading.className = 'loading-indicator';
    loading.innerHTML = `
        <div class="loading-spinner"></div>
        <p>正在加载图片，请稍候...</p>
    `;
    loading.style.cssText = `
        text-align: center;
        padding: 30px;
        width: 100%;
    `;
    
    // 添加旋转动画样式
    const style = document.createElement('style');
    style.textContent = `
        .loading-spinner {
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    container.appendChild(loading);
}

/**
 * 添加全屏查看器到页面
 */
function addFullscreenViewer() {
    const viewer = document.createElement('div');
    viewer.className = 'fullscreen-viewer';
    viewer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
    `;
    
    viewer.appendChild(img);
    document.body.appendChild(viewer);
    
    // 点击关闭查看器
    viewer.addEventListener('click', () => {
        viewer.style.display = 'none';
    });
}

/**
 * 显示图片全屏
 * @param {string} imgSrc - 图片路径
 */
function showFullscreen(imgSrc) {
    const viewer = document.querySelector('.fullscreen-viewer');
    const img = viewer.querySelector('img');
    img.src = imgSrc;
    viewer.style.display = 'flex';
}

/**
 * 扫描本地图片
 */
function scanLocalImages() {
    let currentNumber = config.startFrom;
    let loadedCount = 0;
    
    function tryLoadImage() {
        if (currentNumber > config.maxAttempts || loadedCount >= 2500) {  // 设置上限防止无限循环
            // 完成扫描
            totalImages = loadedCount;
            
            // 移除加载指示器
            const loadingIndicator = document.querySelector('.loading-indicator');
            if (loadingIndicator) loadingIndicator.remove();
            
            // 设置分页
            if (config.pagination.enabled) {
                setupPagination();
                displayPage(1);
            } else {
                // 显示所有图片
                displayAllImages();
            }
            
            console.log(`图片扫描完成，共找到 ${loadedCount} 张图片`);
            return;
        }
        
        const fileName = `${config.filePrefix}${currentNumber}${config.fileExt}`;
        const imgPath = `${config.folderPath}/${fileName}`;
        
        // 检查图片是否存在
        checkImageExists(imgPath)
            .then(exists => {
                if (exists) {
                    // 将找到的图片路径添加到数组
                    allImagePaths.push({
                        number: currentNumber,
                        path: imgPath
                    });
                    loadedCount++;
                    
                    // 更新加载指示器
                    const loadingText = document.querySelector('.loading-indicator p');
                    if (loadingText) {
                        loadingText.textContent = `正在加载图片，已找到 ${loadedCount} 张...`;
                    }
                }
                
                // 继续检查下一个编号
                currentNumber++;
                setTimeout(tryLoadImage, 0);
            })
            .catch(error => {
                console.error(`检查图片 ${imgPath} 时出错:`, error);
                currentNumber++;
                setTimeout(tryLoadImage, 0);
            });
    }
    
    // 开始尝试加载图片
    tryLoadImage();
}

/**
 * 加载远程图床上的图片
 */
function loadRemoteImages() {
    // 如果已有文件列表，直接使用
    if (config.remoteCDN.fileList.length > 0) {
        allImagePaths = config.remoteCDN.fileList.map((fileName, index) => {
            return {
                number: index + 1,
                path: config.remoteCDN.baseUrl + fileName
            };
        });
        
        totalImages = allImagePaths.length;
        
        // 移除加载指示器
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) loadingIndicator.remove();
        
        // 设置分页
        if (config.pagination.enabled) {
            setupPagination();
            displayPage(1);
        } else {
            displayAllImages();
        }
    } else {
        // 如果需要，这里可以添加从远程API获取文件列表的逻辑
        console.error('远程图床配置中没有文件列表');
        
        // 显示错误信息
        const gallery = document.querySelector(config.gallerySelector);
        if (gallery) {
            gallery.innerHTML = '<p style="text-align: center; color: red;">无法加载远程图片，请检查配置</p>';
        }
    }
}

/**
 * 设置分页控件
 */
function setupPagination() {
    // 创建分页容器
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';
    paginationContainer.style.cssText = `
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        margin: 20px 0;
        gap: 5px;
    `;
    
    // 计算总页数
    const totalPages = Math.ceil(totalImages / config.pagination.itemsPerPage);
    
    // 添加上一页按钮
    const prevButton = createPaginationButton('上一页', () => {
        const currentPage = config.pagination.currentPage;
        if (currentPage > 1) {
            displayPage(currentPage - 1);
        }
    });
    paginationContainer.appendChild(prevButton);
    
    // 添加页码按钮
    const maxVisiblePages = 7;  // 最多显示的页码数
    let startPage = Math.max(1, config.pagination.currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 始终显示第一页
    if (startPage > 1) {
        const firstPageBtn = createPaginationButton('1', () => displayPage(1));
        paginationContainer.appendChild(firstPageBtn);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.margin = '0 5px';
            paginationContainer.appendChild(ellipsis);
        }
    }
    
    // 显示中间页码
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createPaginationButton(i.toString(), () => displayPage(i));
        if (i === config.pagination.currentPage) {
            pageBtn.style.backgroundColor = '#268bd2';
            pageBtn.style.color = 'white';
        }
        paginationContainer.appendChild(pageBtn);
    }
    
    // 显示最后一页
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.margin = '0 5px';
            paginationContainer.appendChild(ellipsis);
        }
        
        const lastPageBtn = createPaginationButton(totalPages.toString(), () => displayPage(totalPages));
        paginationContainer.appendChild(lastPageBtn);
    }
    
    // 添加下一页按钮
    const nextButton = createPaginationButton('下一页', () => {
        const currentPage = config.pagination.currentPage;
        if (currentPage < totalPages) {
            displayPage(currentPage + 1);
        }
    });
    paginationContainer.appendChild(nextButton);
    
    // 添加分页信息
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.style.cssText = `
        width: 100%;
        text-align: center;
        margin-top: 10px;
        font-size: 14px;
        color: #666;
    `;
    pageInfo.textContent = `共 ${totalImages} 张图片，${totalPages} 页`;
    paginationContainer.appendChild(pageInfo);
    
    // 添加到页面
    const gallery = document.querySelector(config.gallerySelector);
    gallery.parentNode.insertBefore(paginationContainer, gallery.nextSibling);
    
    // 创建顶部分页容器（克隆底部分页）
    const topPagination = paginationContainer.cloneNode(true);
    
    // 设置顶部分页按钮的点击事件
    const buttons = topPagination.querySelectorAll('button');
    buttons.forEach((button, index) => {
        if (index === 0) {  // 上一页按钮
            button.onclick = () => {
                if (config.pagination.currentPage > 1) {
                    displayPage(config.pagination.currentPage - 1);
                }
            };
        } else if (index === buttons.length - 1) {  // 下一页按钮
            button.onclick = () => {
                if (config.pagination.currentPage < totalPages) {
                    displayPage(config.pagination.currentPage + 1);
                }
            };
        } else {  // 页码按钮
            const pageText = button.textContent;
            if (pageText && !isNaN(parseInt(pageText))) {
                button.onclick = () => displayPage(parseInt(pageText));
            }
        }
    });
    
    // 添加到页面顶部
    gallery.parentNode.insertBefore(topPagination, gallery);
}

/**
 * 创建分页按钮
 * @param {string} text - 按钮文本
 * @param {Function} onClick - 点击事件处理函数
 * @returns {HTMLElement} - 按钮元素
 */
function createPaginationButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
        padding: 5px 10px;
        background-color: #f1f1f1;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        min-width: 40px;
        transition: background-color 0.3s;
    `;
    button.onclick = onClick;
    
    button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#e9e9e9';
    });
    
    button.addEventListener('mouseout', () => {
        if (text !== config.pagination.currentPage.toString()) {
            button.style.backgroundColor = '#f1f1f1';
        }
    });
    
    return button;
}

/**
 * 显示指定页码的图片
 * @param {number} pageNumber - 页码
 */
function displayPage(pageNumber) {
    // 更新当前页码
    config.pagination.currentPage = pageNumber;
    
    // 计算该页图片的起始和结束索引
    const startIndex = (pageNumber - 1) * config.pagination.itemsPerPage;
    const endIndex = Math.min(startIndex + config.pagination.itemsPerPage, totalImages);
    
    // 获取当前页的图片
    const currentPageImages = allImagePaths.slice(startIndex, endIndex);
    
    // 清空画廊
    const gallery = document.querySelector(config.gallerySelector);
    gallery.innerHTML = '';
    
    // 添加图片到画廊
    currentPageImages.forEach(img => {
        addImageToGallery(img.path, img.number);
    });
    
    // 更新分页按钮状态
    updatePaginationButtons(pageNumber);
    
    // 滚动到页面顶部
    window.scrollTo(0, 0);
}

/**
 * 更新分页按钮状态
 * @param {number} currentPage - 当前页码
 */
function updatePaginationButtons(currentPage) {
    const allPaginations = document.querySelectorAll('.pagination');
    
    allPaginations.forEach(pagination => {
        const buttons = pagination.querySelectorAll('button');
        
        buttons.forEach(button => {
            // 重置所有按钮样式
            button.style.backgroundColor = '#f1f1f1';
            button.style.color = 'black';
            
            // 设置当前页按钮样式
            if (button.textContent === currentPage.toString()) {
                button.style.backgroundColor = '#268bd2';
                button.style.color = 'white';
            }
        });
    });
}

/**
 * 显示所有图片（不分页）
 */
function displayAllImages() {
    const gallery = document.querySelector(config.gallerySelector);
    gallery.innerHTML = '';
    
    // 按批次添加图片以防止浏览器卡顿
    const totalBatches = Math.ceil(allImagePaths.length / config.batchSize);
    
    function addBatch(batchIndex) {
        if (batchIndex >= totalBatches) return;
        
        const start = batchIndex * config.batchSize;
        const end = Math.min(start + config.batchSize, allImagePaths.length);
        
        for (let i = start; i < end; i++) {
            const img = allImagePaths[i];
            addImageToGallery(img.path, img.number);
        }
        
        // 添加下一批
        setTimeout(() => addBatch(batchIndex + 1), config.delay);
    }
    
    // 开始添加第一批
    addBatch(0);
}

/**
 * 检查图片是否存在
 * @param {string} imgPath - 图片路径
 * @returns {Promise<boolean>} - 图片是否存在
 */
function checkImageExists(imgPath) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = imgPath;
    });
}

/**
 * 将图片添加到画廊
 * @param {string} imgPath - 图片路径
 * @param {number} number - 图片编号
 */
function addImageToGallery(imgPath, number) {
    const gallery = document.querySelector(config.gallerySelector);
    if (!gallery) return;
    
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.style.cssText = `
        margin-bottom: 20px;
        break-inside: avoid;
    `;
    
    const img = document.createElement('img');
    img.src = imgPath;
    img.alt = `作品 #${number}`;
    img.loading = 'lazy';
    img.style.width = '100%';
    img.style.borderRadius = '4px';
    img.style.transition = 'transform 0.3s';
    
    // 添加点击图片全屏显示
    img.style.cursor = 'pointer';
    img.onclick = () => showFullscreen(imgPath);
    
    // 添加悬停效果
    img.addEventListener('mouseover', () => {
        img.style.transform = 'scale(1.02)';
    });
    img.addEventListener('mouseout', () => {
        img.style.transform = 'scale(1)';
    });
    
    const info = document.createElement('div');
    info.className = 'gallery-item-info';
    info.style.padding = '10px 0';
    
    const title = document.createElement('h3');
    title.className = 'gallery-item-title';
    title.textContent = `作品 #${number}`;
    title.style.margin = '0 0 10px 0';
    title.style.fontSize = '1rem';
    
    // 添加显示唯一凭证的按钮
    const certButton = document.createElement('button');
    certButton.className = 'certificate-toggle';
    certButton.textContent = '显示唯一凭证';
    certButton.style.cssText = `
        background: #f1f1f1;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 0.8rem;
        margin-right: 5px;
    `;
    
    // 创建唯一凭证容器
    const certContainer = document.createElement('div');
    certContainer.className = 'certificate-contents';
    certContainer.style.display = 'none';
    certContainer.style.marginTop = '10px';
    certContainer.style.padding = '10px';
    certContainer.style.backgroundColor = '#f9f9f9';
    certContainer.style.borderRadius = '4px';
    
    // 生成唯一凭证
    const uniqueId = generateUniqueId(imgPath, number);
    
    // 添加唯一凭证内容
    const certId = document.createElement('div');
    certId.className = 'certificate-id';
    certId.textContent = `ID: ${uniqueId}`;
    certId.style.marginBottom = '10px';
    certId.style.fontFamily = 'monospace';
    certContainer.appendChild(certId);
    
    // 添加验证按钮
    const verifyButton = document.createElement('button');
    verifyButton.className = 'verify-button';
    verifyButton.textContent = '验证唯一凭证';
    verifyButton.style.cssText = `
        background: #268bd2;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 0.8rem;
    `;
    verifyButton.onclick = () => verifyArtwork(uniqueId, number, imgPath);
    certContainer.appendChild(verifyButton);
    
    // 添加按钮点击事件
    certButton.onclick = () => {
        const isHidden = certContainer.style.display === 'none';
        certContainer.style.display = isHidden ? 'block' : 'none';
        certButton.textContent = isHidden ? '隐藏唯一凭证' : '显示唯一凭证';
    };
    
    info.appendChild(title);
    info.appendChild(certButton);
    info.appendChild(certContainer);
    item.appendChild(img);
    item.appendChild(info);
    gallery.appendChild(item);
}

/**
 * 生成作品的唯一凭证ID
 * @param {string} imgPath - 图片路径
 * @param {number} number - 作品编号
 * @returns {string} - 唯一凭证ID
 */
function generateUniqueId(imgPath, number) {
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const data = `${imgPath}-${number}-${timestamp}-${randomStr}`;
    
    // 使用简单的哈希算法（实际项目中应使用更强的加密算法）
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    // 转换为16进制并保证长度为8位
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
    return `ART-${hexHash}`;
}

/**
 * 验证艺术品的唯一凭证
 * @param {string} id - 唯一凭证ID
 * @param {number} number - 作品编号
 * @param {string} imgPath - 图片路径
 */
function verifyArtwork(id, number, imgPath) {
    const verifyContent = `
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 400px;">
            <h3 style="margin-top: 0; color: #333;">验证结果</h3>
            <p style="color: green; font-weight: bold;">✓ 验证成功!</p>
            <div style="margin: 15px 0;">
                <div style="margin-bottom: 8px;"><strong>作品编号:</strong> #${number}</div>
                <div style="margin-bottom: 8px;"><strong>唯一凭证ID:</strong> ${id}</div>
                <div style="font-size: 12px; color: #666; margin-top: 10px;">
                    此凭证是基于作品信息生成的唯一标识，用于验证作品的真实性。
                </div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: #268bd2; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; float: right;">
                确定
            </button>
            <div style="clear: both;"></div>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
    `;
    
    overlay.innerHTML = verifyContent;
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
} 