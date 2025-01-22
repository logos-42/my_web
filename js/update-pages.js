// 获取所有HTML文件
const fs = require('fs');
const path = require('path');

const pages = [
    'index.html',
    'essays.html',
    'blog.html',
    'projects.html',
    'philosophy.html',
    'music.html',
    'art.html',
    'wechat.html'
];

// 需要添加的CSS和JS引用
const cssLink = '    <link rel="stylesheet" href="css/sidebar.css">\n';
const jsScript = '    <script src="js/sidebar.js"></script>\n';

// 侧边栏切换按钮HTML
const toggleButton = '            <button class="sidebar-toggle" aria-label="切换侧边栏">\n                <span class="toggle-icon"></span>\n            </button>\n';

// 更新每个页面
pages.forEach(page => {
    const filePath = path.join(__dirname, '..', page);
    
    // 读取文件内容
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 添加CSS和JS引用
    if (!content.includes('sidebar.css')) {
        content = content.replace('</head>', `${cssLink}${jsScript}</head>`);
    }
    
    // 添加切换按钮
    if (!content.includes('sidebar-toggle')) {
        content = content.replace('<nav class="sidebar">', `<nav class="sidebar">\n${toggleButton}`);
    }
    
    // 写回文件
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${page}`);
});

console.log('All pages have been updated successfully!');
