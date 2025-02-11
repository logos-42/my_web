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

// 获取当前页面的路径
const currentPath = window.location.pathname;

// 使用页面设置的基础路径，如果没有则使用根路径
const basePath = window.backlinksBasePath || '/';

// 从路径中提取文件名
const fileName = currentPath.split('/').pop();

// 构建API请求URL
const apiUrl = `${basePath}api/backlinks/${fileName}`;

// 获取反向链接列表元素
const backlinksListElement = document.getElementById('backlinks-list');

// 如果找到了元素，则尝试加载反向链接
if (backlinksListElement) {
    // 这里模拟从API获取反向链接
    // 实际使用时，这里应该是一个真实的API调用
    const backlinks = [
        { title: '示例文章1', url: 'example1.html' },
        { title: '示例文章2', url: 'example2.html' }
    ];
    
    // 如果有反向链接，则显示它们
    if (backlinks.length > 0) {
        backlinks.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `${basePath}${link.url}`;
            a.textContent = link.title;
            li.appendChild(a);
            backlinksListElement.appendChild(li);
        });
    } else {
        // 如果没有反向链接，显示提示信息
        const li = document.createElement('li');
        li.textContent = '暂无反向链接';
        backlinksListElement.appendChild(li);
    }
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