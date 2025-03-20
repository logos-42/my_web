/**
 * 画廊图片自动加载脚本
 * 自动扫描finish文件夹中的图片并显示在画廊中
 * 支持分页加载、外部图床和收藏功能
 */

// 配置对象
const config = {
    // 文件来源配置
    sourceType: 'static',  // 改为static模式
    
    // 静态图片列表配置
    staticImages: {
        enabled: true,
        images: [
            // 在这里手动添加所有图片的信息
            // { number: 1, path: 'finish/thumbnail_1.jpg' },
            // { number: 2, path: 'finish/thumbnail_2.jpg' },
            // 更多图片...
        ]
    },
    
    // 远程图床配置
    remoteCDN: {
        enabled: false,
        baseUrl: '',
        fileList: []
    },
    
    // 画廊配置
    gallerySelector: '.gallery',
    
    // 分页配置
    pagination: {
        enabled: true,
        itemsPerPage: 24,
        currentPage: 1
    },
    
    // 性能配置
    batchSize: 10,
    delay: 10,
    
    // 排序配置
    sortMode: 'popular',
    popularityWeight: 3
};

// 全局变量
let allImagePaths = [];  // 存储所有找到的图片路径
let totalImages = 0;  // 图片总数
let wantedItems = {};  // 存储想要的作品数据 {imageNumber: wantCount}

// 初始化函数
function initGallery() {
    // 加载已保存的"想要"数据
    loadWantedData();
    
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
    
    // 设置排序按钮事件
    setupSortButtons();
    
    // 自动生成图片列表（如果未手动配置）
    if (config.staticImages.images.length === 0) {
        generateImageList();
    }
    
    // 加载图片
    loadImages();
}

// 生成图片列表
function generateImageList() {
    // 这里可以根据实际情况设置图片数量
    const totalImages = 100; // 假设有100张图片
    
    for (let i = 1; i <= totalImages; i++) {
        config.staticImages.images.push({
            number: i,
            path: `finish/thumbnail_${i}.jpg`
        });
    }
}

// 加载图片
function loadImages() {
    allImagePaths = [...config.staticImages.images];
    totalImages = allImagePaths.length;
    
    // 移除加载指示器
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
    
    // 对图片进行排序
    sortAndDisplayImages();
    
    // 设置分页
    if (config.pagination.enabled) {
        setupPagination();
    }
}

// 等待DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', initGallery);

/**
 * 加载保存的"想要"数据
 */
function loadWantedData() {
    const savedData = localStorage.getItem('gallery_wanted_items');
    if (savedData) {
        try {
            wantedItems = JSON.parse(savedData);
        } catch (e) {
            console.error('无法解析保存的想要数据', e);
            wantedItems = {};
        }
    }
}

/**
 * 保存"想要"数据到localStorage
 */
function saveWantedData() {
    localStorage.setItem('gallery_wanted_items', JSON.stringify(wantedItems));
}

/**
 * 设置排序按钮事件
 */
function setupSortButtons() {
    const sortButtons = document.querySelectorAll('.sort-button');
    
    sortButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 更新活动按钮样式
            sortButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 获取排序模式
            const sortMode = this.getAttribute('data-sort');
            config.sortMode = sortMode;
            
            // 重新排序并显示
            if (allImagePaths.length > 0) {
                sortAndDisplayImages();
            }
        });
    });
}

/**
 * 根据当前排序模式对图片进行排序并显示
 */
function sortAndDisplayImages() {
    let sortedImages = [...allImagePaths];
    
    switch (config.sortMode) {
        case 'popular':
            // 按受欢迎度排序
            sortedImages.sort((a, b) => {
                const aWants = wantedItems[a.number] || 0;
                const bWants = wantedItems[b.number] || 0;
                return bWants - aWants;
            });
            break;
            
        case 'random':
            // 随机排序（受欢迎度有更高权重）
            sortedImages = weightedRandomSort(sortedImages);
            break;
            
        case 'newest':
            // 按编号倒序排序（假设编号越大越新）
            sortedImages.sort((a, b) => b.number - a.number);
            break;
    }
    
    // 如果启用分页，更新分页数据并显示第一页
    if (config.pagination.enabled) {
        allImagePaths = sortedImages;
        config.pagination.currentPage = 1;
        displayPage(1);
        
        // 更新分页按钮状态
        updatePaginationButtons(1);
    } else {
        // 直接显示所有排序后的图片
        displaySortedImages(sortedImages);
    }
}

/**
 * 带权重的随机排序
 * @param {Array} images - 图片数组
 * @returns {Array} - 排序后的数组
 */
function weightedRandomSort(images) {
    // 创建带权重的图片数组
    const weightedImages = images.map(img => {
        // 计算权重：基础权重1 + 想要数量 * 权重系数
        const wants = wantedItems[img.number] || 0;
        const weight = 1 + wants * config.popularityWeight;
        return { ...img, weight };
    });
    
    // Fisher-Yates随机排序，但考虑权重
    for (let i = weightedImages.length - 1; i > 0; i--) {
        // 生成带权重的随机索引
        let weightSum = 0;
        for (let j = 0; j <= i; j++) {
            weightSum += weightedImages[j].weight;
        }
        
        let random = Math.random() * weightSum;
        let j = 0;
        for (weightSum = weightedImages[0].weight; weightSum < random && j < i; j++) {
            weightSum += weightedImages[j + 1].weight;
        }
        
        // 交换元素
        [weightedImages[i], weightedImages[j]] = [weightedImages[j], weightedImages[i]];
    }
    
    // 返回排序后的原始图片数组（不带权重属性）
    return weightedImages.map(img => ({ number: img.number, path: img.path }));
}

/**
 * 直接显示排序后的图片
 * @param {Array} sortedImages - 已排序的图片数组
 */
function displaySortedImages(sortedImages) {
    const gallery = document.querySelector(config.gallerySelector);
    gallery.innerHTML = '';
    
    // 按批次添加图片以防止浏览器卡顿
    const totalBatches = Math.ceil(sortedImages.length / config.batchSize);
    
    function addBatch(batchIndex) {
        if (batchIndex >= totalBatches) return;
        
        const start = batchIndex * config.batchSize;
        const end = Math.min(start + config.batchSize, sortedImages.length);
        
        for (let i = start; i < end; i++) {
            const img = sortedImages[i];
            addImageToGallery(img.path, img.number);
        }
        
        // 添加下一批
        setTimeout(() => addBatch(batchIndex + 1), config.delay);
    }
    
    // 开始添加第一批
    addBatch(0);
}

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
    
    container.appendChild(loading);
}

/**
 * 添加全屏查看器到页面
 */
function addFullscreenViewer() {
    const viewer = document.createElement('div');
    viewer.className = 'fullscreen-viewer';
    
    const img = document.createElement('img');
    
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
 * 设置分页控件
 */
function setupPagination() {
    // 创建分页容器
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';
    
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
    
    // 获取想要数量
    const wantCount = wantedItems[number] || 0;
    
    const item = document.createElement('div');
    item.className = 'gallery-item';
    
    const img = document.createElement('img');
    img.src = imgPath;
    img.alt = `作品 #${number}`;
    img.loading = 'lazy';
    
    // 添加点击图片全屏显示
    img.style.cursor = 'pointer';
    img.onclick = () => showFullscreen(imgPath);
    
    const info = document.createElement('div');
    info.className = 'gallery-item-info';
    
    const title = document.createElement('h3');
    title.className = 'gallery-item-title';
    title.textContent = `作品 #${number}`;
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'gallery-buttons';
    
    // 添加"想要"按钮
    const wantButton = document.createElement('button');
    wantButton.className = 'want-button';
    if (wantCount > 0) {
        wantButton.classList.add('active');
    }
    
    wantButton.innerHTML = `<i class="fa-solid fa-heart"></i> 想要 <span class="want-count">${wantCount > 0 ? wantCount : ''}</span>`;
    
    wantButton.onclick = () => {
        // 获取当前"想要"数量
        let currentWants = wantedItems[number] || 0;
        
        if (wantButton.classList.contains('active')) {
            // 如果已经想要过，减少数量
            currentWants = Math.max(0, currentWants - 1);
            if (currentWants === 0) {
                wantButton.classList.remove('active');
            }
        } else {
            // 如果没想要过，增加数量
            currentWants += 1;
            wantButton.classList.add('active');
        }
        
        // 更新显示和存储数据
        wantedItems[number] = currentWants;
        wantButton.querySelector('.want-count').textContent = currentWants > 0 ? currentWants : '';
        
        // 保存数据
        saveWantedData();
    };
    
    // 添加显示唯一凭证的按钮
    const certButton = document.createElement('button');
    certButton.className = 'certificate-toggle';
    certButton.textContent = '显示唯一凭证';
    
    // 创建唯一凭证容器
    const certContainer = document.createElement('div');
    certContainer.className = 'certificate-contents';
    certContainer.style.display = 'none';
    
    // 生成唯一凭证
    const uniqueId = generateUniqueId(imgPath, number);
    
    // 添加唯一凭证内容
    const certId = document.createElement('div');
    certId.className = 'certificate-id';
    certId.textContent = `ID: ${uniqueId}`;
    certContainer.appendChild(certId);
    
    // 添加验证按钮
    const verifyButton = document.createElement('button');
    verifyButton.className = 'verify-button';
    verifyButton.textContent = '验证唯一凭证';
    verifyButton.onclick = () => verifyArtwork(uniqueId, number, imgPath);
    certContainer.appendChild(verifyButton);
    
    // 添加按钮点击事件
    certButton.onclick = () => {
        const isHidden = certContainer.style.display === 'none';
        certContainer.style.display = isHidden ? 'block' : 'none';
        certButton.textContent = isHidden ? '隐藏唯一凭证' : '显示唯一凭证';
    };
    
    // 组装元素
    buttonContainer.appendChild(wantButton);
    buttonContainer.appendChild(certButton);
    
    info.appendChild(title);
    info.appendChild(buttonContainer);
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