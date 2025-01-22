// 获取当前页面相对于根目录的层级
function getPathDepth() {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(part => part.length > 0);
    return pathParts.length;
}

// 根据页面层级调整资源路径
function adjustPath(path) {
    const depth = getPathDepth();
    const prefix = '../'.repeat(depth - 1);
    return prefix + path.replace(/^\//, '');
}

// 加载头部模板
async function loadHeader() {
    try {
        const headerPath = adjustPath('/templates/header.html');
        const response = await fetch(headerPath);
        const html = await response.text();
        
        // 调整所有资源路径
        const adjustedHtml = html.replace(/href="\/([^"]+)"/g, (match, path) => {
            return `href="${adjustPath(path)}"`;
        }).replace(/src="\/([^"]+)"/g, (match, path) => {
            return `src="${adjustPath(path)}"`;
        });

        // 将处理后的模板内容插入到head标签中
        document.head.insertAdjacentHTML('afterbegin', adjustedHtml);
        
        // 设置页面标题
        const titleElement = document.querySelector('title');
        if (!titleElement) {
            const newTitle = document.createElement('title');
            newTitle.textContent = document.title || '我的个人网站';
            document.head.appendChild(newTitle);
        }
    } catch (error) {
        console.error('加载头部模板失败:', error);
    }
}

// 立即执行的匿名函数，避免全局变量污染
(function() {
    // 获取当前脚本的路径
    function getScriptPath() {
        const scripts = document.getElementsByTagName('script');
        const currentScript = scripts[scripts.length - 1];
        const scriptPath = currentScript.src;
        return scriptPath.substring(0, scriptPath.lastIndexOf('/js/'));
    }

    // 获取相对于根目录的路径
    function getBasePath() {
        const scriptPath = getScriptPath();
        return scriptPath.substring(scriptPath.lastIndexOf('我的网站'));
    }

    // 添加favicon链接
    function addFaviconLinks() {
        const basePath = getBasePath();
        const favicons = [
            { rel: 'icon', type: 'image/x-icon', href: 'favicon_io (4)/favicon.ico' },
            { rel: 'apple-touch-icon', sizes: '180x180', href: 'favicon_io (4)/apple-touch-icon.png' },
            { rel: 'icon', type: 'image/png', sizes: '32x32', href: 'favicon_io (4)/favicon-32x32.png' },
            { rel: 'icon', type: 'image/png', sizes: '16x16', href: 'favicon_io (4)/favicon-16x16.png' },
            { rel: 'manifest', href: 'favicon_io (4)/site.webmanifest' }
        ];

        favicons.forEach(favicon => {
            // 检查是否已存在相同的图标链接
            const existingLink = document.querySelector(`link[href*="${favicon.href}"]`);
            if (!existingLink) {
                const link = document.createElement('link');
                link.rel = favicon.rel;
                if (favicon.type) link.type = favicon.type;
                if (favicon.sizes) link.sizes = favicon.sizes;
                link.href = `${basePath}/${favicon.href}`;
                document.head.appendChild(link);
            }
        });
    }

    // 当DOM内容加载完成时添加图标
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addFaviconLinks);
    } else {
        addFaviconLinks();
    }
})();

// 当DOM加载完成时执行
document.addEventListener('DOMContentLoaded', loadHeader);
