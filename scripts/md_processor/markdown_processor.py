"""
Markdown处理器模块
负责将Markdown文件转换为HTML
"""

import os
from pathlib import Path
from typing import Dict, List
import markdown
import frontmatter
from datetime import datetime
from jinja2 import Template, Environment, FileSystemLoader

class MarkdownProcessor:
    def __init__(self, config: dict, link_processor):
        self.config = config
        self.link_processor = link_processor
        self.articles = []
        
        # 设置Jinja2环境
        template_dir = Path(__file__).parent.parent.parent
        self.env = Environment(loader=FileSystemLoader(template_dir))
        
        # 读取基础模板
        with open(template_dir / 'index.html', 'r', encoding='utf-8') as f:
            template_content = f.read()
            
        # 提取content区域作为基础模板
        content_start = template_content.find('<main class="content">')
        content_end = template_content.find('</main>', content_start) + len('</main>')
        
        # 创建新的模板，保持完整的HTML结构
        self.base_template = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{{{ title }}}} - 我的个人网站</title>
    <link rel="apple-touch-icon" sizes="180x180" href="../../favicon_io/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="../../favicon_io/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="../../favicon_io/favicon-16x16.png">
    <link rel="manifest" href="../../favicon_io/site.webmanifest">
    <link rel="stylesheet" href="../../styles.css">
    <script src="../../backlinks.js"></script>
    <script src="../../js/template-loader.js"></script>
    <link rel="stylesheet" href="../../css/sidebar.css">
    <script src="../../js/sidebar.js"></script>
</head>
<body class="article-page">
    <div class="layout">
        <nav class="sidebar">
            <button class="sidebar-toggle" aria-label="切换侧边栏">
                <span class="toggle-icon"></span>
            </button>

            <div class="nav-section">
                <div class="nav-item"><a href="../../index.html">首页</a></div>
                <div class="nav-item"><a href="../../essays.html">文章</a></div>
                <div class="nav-item"><a href="../../blog.html">博客</a></div>
                <div class="nav-item"><a href="../../projects.html">新奇项目</a></div>
                <div class="nav-item"><a href="../../philosophy.html">哲科</a></div>
                <div class="nav-item"><a href="../../music.html">音乐</a></div>
                <div class="nav-item"><a href="../../art.html">绘画</a></div>
                <div class="nav-item"><a href="../../wechat.html">公众号</a></div>
            </div>
        </nav>
        
        <main class="content">
            {{{{ content }}}}
            
            <section class="backlinks">
                <h3>反向链接</h3>
                <ul id="backlinks-list"></ul>
            </section>
        </main>
    </div>
</body>
</html>'''
        
    def process_file(self, file_path: Path) -> str:
        """
        处理单个Markdown文件
        
        Args:
            file_path: Markdown文件路径
            
        Returns:
            生成的HTML内容
        """
        try:
            # 读取文件内容
            with open(file_path, 'r', encoding='utf-8') as f:
                post = frontmatter.load(f)
            
            # 获取元数据
            metadata = post.metadata
            content = post.content
            
            # 转换Markdown为HTML
            html_content = markdown.markdown(content, extensions=['fenced_code', 'tables'])
            
            # 获取分类信息
            category = metadata.get('category', 'articles')
            category_names = {
                'articles': '文章',
                'blogs': '博客',
                'projects': '项目',
                'art': '艺术',
                'music': '音乐',
                'philosophy': '哲科'
            }
            category_name = category_names.get(category, category)
            
            # 使用模板生成完整的HTML
            template = Template(self.base_template)
            html = template.render(
                title=metadata.get('title', '无标题'),
                content=html_content,
                category=category,
                category_name=category_name
            )
            
            return html
            
        except Exception as e:
            print(f"处理文件 {file_path} 时出错: {str(e)}")
            return None
            
    def generate_article_list(self) -> List[Dict]:
        """
        生成文章列表
        
        Returns:
            文章信息列表
        """
        def parse_date(date_val):
            if isinstance(date_val, datetime):
                return date_val.timestamp()
            if isinstance(date_val, str):
                try:
                    return datetime.strptime(date_val, '%Y-%m-%d').timestamp()
                except:
                    return datetime.now().timestamp()
            return datetime.now().timestamp()
            
        # 确保所有文章都有日期
        for article in self.articles:
            if 'date' not in article or not article['date']:
                article['date'] = datetime.now().strftime('%Y-%m-%d')
                
        # 按日期降序排序，相同日期的按标题排序
        sorted_articles = sorted(
            self.articles,
            key=lambda x: (-parse_date(x['date']), x['title'])
        )
        
        return sorted_articles 