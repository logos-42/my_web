// 使用marked库来解析markdown
let articleCache = new Map();

async function loadArticle(path) {
    if (articleCache.has(path)) {
        return articleCache.get(path);
    }

    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const markdown = await response.text();
        const html = marked.parse(markdown);
        articleCache.set(path, html);
        return html;
    } catch (error) {
        console.error('Error loading article:', error);
        return null;
    }
}

async function loadArticleList() {
    try {
        const response = await fetch('/api/articles.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.articles;
    } catch (error) {
        console.error('Error loading article list:', error);
        return [];
    }
}

function renderArticleList(articles) {
    const container = document.querySelector('.essays-list');
    if (!container) return;

    container.innerHTML = articles.map(article => `
        <div class="essay-item">
            <a href="${article.path}">${article.title}</a>
            <span class="essay-date">${article.date}</span>
        </div>
    `).join('');

    // 添加点击事件监听器
    container.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        
        e.preventDefault();
        const path = link.getAttribute('href');
        const content = await loadArticle(path);
        if (content) {
            renderArticle(content);
        }
    });
}

function renderArticle(content) {
    const mainContent = document.querySelector('.content');
    if (!mainContent) return;

    // 保存原始内容
    if (!mainContent.dataset.originalContent) {
        mainContent.dataset.originalContent = mainContent.innerHTML;
    }

    // 创建文章容器
    const articleContainer = document.createElement('div');
    articleContainer.className = 'article-content';
    articleContainer.innerHTML = content;

    // 创建返回按钮
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.textContent = '返回文章列表';
    backButton.onclick = () => {
        mainContent.innerHTML = mainContent.dataset.originalContent;
    };

    // 替换主内容
    mainContent.innerHTML = '';
    mainContent.appendChild(backButton);
    mainContent.appendChild(articleContainer);
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 加载marked库
    if (!window.marked) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
    }

    // 加载文章列表
    const articles = await loadArticleList();
    renderArticleList(articles);
}); 