// 存储所有页面之间的链接关系
const linkGraph = {
    'index.html': [],
    'essays.html': ['articles/programming-joy.html', 'articles/learning-tech.html', 'articles/writing-thinking.html', 'articles/tech-choice.html', 'blog.html'],
    'blog.html': ['blogs/react-modern-web.html', 'blogs/typescript-practice.html', 'blogs/git-workflow.html', 'blogs/frontend-optimization.html', 'essays.html'],
    'projects.html': [],
    'philosophy.html': ['articles/complexity-science.html', 'articles/consciousness.html', 'articles/ecosystem.html', 'articles/tech-evolution.html'],
    'music.html': [],
    'art.html': [],
    'wechat.html': [],
    'articles/index.html': [],
    'articles/complexity-science.html': ['philosophy.html'],
    'articles/consciousness.html': ['philosophy.html'],
    'articles/ecosystem.html': ['philosophy.html'],
    'articles/tech-evolution.html': ['philosophy.html'],
    'articles/programming-joy.html': ['essays.html'],
    'articles/learning-tech.html': ['essays.html'],
    'articles/writing-thinking.html': ['essays.html'],
    'articles/tech-choice.html': ['essays.html'],
    'blogs/react-modern-web.html': ['blog.html'],
    'blogs/typescript-practice.html': ['blog.html'],
    'blogs/git-workflow.html': ['blog.html'],
    'blogs/frontend-optimization.html': ['blog.html']
};

// 存储反向链接关系
const backlinks = {};

// 初始化反向链接
function initBacklinks() {
    // 清空现有反向链接
    Object.keys(linkGraph).forEach(page => {
        backlinks[page] = [];
    });

    // 构建反向链接关系
    Object.entries(linkGraph).forEach(([sourcePage, links]) => {
        links.forEach(targetPage => {
            if (!backlinks[targetPage]) {
                backlinks[targetPage] = [];
            }
            backlinks[targetPage].push(sourcePage);
        });
    });
}

// 显示当前页面的反向链接
function showBacklinks() {
    const currentPath = window.location.pathname.replace(/^\//, '');
    const currentPage = currentPath || 'index.html';
    const backlinksList = document.getElementById('backlinks-list');
    if (!backlinksList) return;

    const pageBacklinks = backlinks[currentPage] || [];
    
    if (pageBacklinks.length === 0) {
        backlinksList.innerHTML = '<p>暂无反向链接</p>';
        return;
    }

    const links = pageBacklinks.map(page => {
        const title = page.split('/').pop().replace('.html', '').split('-').map(
            word => word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        return `<li><a href="${getRelativePath(currentPage, page)}">${title}</a></li>`;
    }).join('');

    backlinksList.innerHTML = links;
}

// 获取相对路径
function getRelativePath(fromPage, toPage) {
    const fromParts = fromPage.split('/');
    const toParts = toPage.split('/');
    
    // 如果在同一目录下
    if (fromParts.length === toParts.length) {
        return toPage;
    }
    
    // 如果从子目录链接到根目录
    if (fromParts.length > toParts.length) {
        return '../'.repeat(fromParts.length - 1) + toPage;
    }
    
    // 如果从根目录链接到子目录
    return toPage;
}

// 添加新的链接关系
function addLink(sourcePage, targetPage) {
    if (!linkGraph[sourcePage]) {
        linkGraph[sourcePage] = [];
    }
    if (!linkGraph[sourcePage].includes(targetPage)) {
        linkGraph[sourcePage].push(targetPage);
        initBacklinks();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initBacklinks();
    showBacklinks();
}); 