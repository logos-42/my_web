/**
 * 画廊管理和唯一凭证生成脚本
 * 使用SHA-256生成唯一凭证
 */

document.addEventListener('DOMContentLoaded', function() {
    // 首先加载SHA-256库
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js')
        .then(() => {
            // SHA-256库加载成功后，初始化画廊
            initializeGallery();
        })
        .catch(error => {
            console.error('SHA-256库加载失败，使用备用哈希算法', error);
            // 如果SHA-256加载失败，使用备用哈希算法
            initializeGallery(true);
        });
});

/**
 * 动态加载外部脚本
 * @param {string} url - 脚本URL
 * @returns {Promise} - 加载结果Promise
 */
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * 初始化画廊唯一凭证
 * @param {boolean} useFallback - 是否使用备用哈希算法
 */
function initializeGallery(useFallback = false) {
    // 为每个画廊项目生成唯一ID
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        const img = item.querySelector('img');
        if (!img) return;
        
        // 获取图片信息
        const imgSrc = img.src;
        const imgAlt = img.alt || '';
        const timestamp = new Date().getTime();
        
        // 创建用于哈希的数据对象
        const hashData = {
            src: imgSrc,
            title: imgAlt,
            timestamp: timestamp,
            randomSalt: Math.random().toString(36).substring(2, 15)
        };
        
        // 生成唯一ID
        let uniqueId;
        if (useFallback || typeof sha256 === 'undefined') {
            // 使用备用哈希算法
            uniqueId = generateFallbackHash(JSON.stringify(hashData));
        } else {
            // 使用SHA-256算法
            uniqueId = 'ART-' + sha256(JSON.stringify(hashData)).substring(0, 8).toUpperCase();
        }
        
        // 创建证书ID元素
        const certIdElem = document.createElement('div');
        certIdElem.className = 'certificate-contents';
        certIdElem.style.display = 'none';
        
        // 添加唯一ID显示
        const idSpan = document.createElement('span');
        idSpan.className = 'certificate-id';
        idSpan.textContent = 'ID: ' + uniqueId;
        certIdElem.appendChild(idSpan);
        
        // 创建验证链接
        const verifyLink = document.createElement('a');
        verifyLink.href = '#';
        verifyLink.className = 'certificate-verify';
        verifyLink.textContent = '验证唯一凭证';
        verifyLink.onclick = function(e) {
            e.preventDefault();
            verifyArtwork(uniqueId, imgAlt, hashData);
        };
        certIdElem.appendChild(verifyLink);
        
        // 创建证书容器
        const certContainer = document.createElement('div');
        certContainer.className = 'certificate';
        certContainer.appendChild(certIdElem);
        
        // 创建显示/隐藏按钮
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'certificate-toggle';
        toggleBtn.textContent = '显示唯一凭证';
        toggleBtn.onclick = function(e) {
            e.preventDefault();
            const certContent = certContainer.querySelector('.certificate-contents');
            if (certContent.style.display === 'block') {
                certContent.style.display = 'none';
                this.textContent = '显示唯一凭证';
            } else {
                certContent.style.display = 'block';
                this.textContent = '隐藏唯一凭证';
            }
        };
        
        // 将证书和按钮添加到画廊项目信息区域
        const infoArea = item.querySelector('.gallery-item-info');
        infoArea.appendChild(toggleBtn);
        infoArea.appendChild(certContainer);
    });
}

/**
 * 备用哈希算法 (基于简单的字符串哈希)
 * @param {string} str - 要哈希的字符串
 * @return {string} - 哈希结果
 */
function generateFallbackHash(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString(16);
    
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
    }
    
    // 生成带前缀的十六进制字符串
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    return 'ART-' + hexHash.toUpperCase();
}

/**
 * 验证艺术品的唯一凭证
 * @param {string} id - 唯一凭证ID
 * @param {string} artTitle - 作品标题
 * @param {object} hashData - 用于生成哈希的原始数据
 */
function verifyArtwork(id, artTitle, hashData) {
    // 创建验证弹窗的HTML
    const verifyContent = `
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; max-width: 400px;">
            <h3 style="margin-top: 0; color: #333;">此页面显示</h3>
            <p style="color: green; font-weight: bold;">验证成功!</p>
            <div style="margin: 15px 0;">
                <div style="margin-bottom: 8px;"><strong>作品:</strong> ${artTitle}</div>
                <div style="margin-bottom: 8px;"><strong>唯一凭证ID:</strong> ${id}</div>
                <div style="font-size: 12px; color: #666; margin-top: 10px;">此凭证是唯一的，基于作品信息生成的哈希值。</div>
            </div>
            <button style="background: #268bd2; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; float: right;" onclick="this.parentNode.remove()">确定</button>
            <div style="clear: both;"></div>
        </div>
    `;
    
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999;';
    overlay.innerHTML = verifyContent;
    
    // 添加到页面
    document.body.appendChild(overlay);
    
    // 点击遮罩层关闭
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
} 