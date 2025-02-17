"""
Markdown处理器模块
负责Markdown文件的解析、转换和HTML生成
"""

import os
import markdown
import frontmatter
import re
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

class MarkdownProcessor:
    def __init__(self, config: dict, link_processor=None):
        """
        初始化Markdown处理器
        
        Args:
            config: 配置字典，包含必要的路径和设置
            link_processor: 链接处理器实例
        """
        self.config = config
        self.link_processor = link_processor
        self.md = markdown.Markdown(extensions=['meta', 'fenced_code', 'tables'])
        self.article_list = []
        
        # 添加分类映射关系
        self.category_mapping = {
            'articles': 'essays.html',
            'blogs': 'blog/index.html',
            'projects': 'projects.html',
            'art': 'art.html',
            'music': 'music.html',
            'philosophy': 'philosophy.html'
        }
        
    def process_file(self, md_file: Path) -> Optional[str]:
        """
        处理单个Markdown文件
        
        Args:
            md_file: Markdown文件路径
            
        Returns:
            生成的HTML内容，如果处理失败则返回None
        """
        try:
            # 读取并解析frontmatter
            with md_file.open('r', encoding='utf-8') as f:
                post = frontmatter.load(f)
            
            # 获取元数据
            metadata = post.metadata
            content = post.content
            
            # 确保metadata中有必要的字段
            if 'title' not in metadata:
                metadata['title'] = md_file.stem.replace('-', ' ').title()
            if 'date' not in metadata:
                metadata['date'] = '2024-01-01'
                
            # 确定文章类型和返回链接
            category = md_file.parent.name
            if category in ['blogs', 'articles', 'projects', 'art', 'music', 'philosophy']:
                metadata['type'] = category[:-1] if category.endswith('s') else category
                metadata['category_page'] = self.category_mapping.get(category, 'index.html')
                
                # 使用相对于根目录的路径
                relative_path = md_file.relative_to(Path(self.config['markdown_dir']))
                output_path = relative_path.with_suffix('.html')
                
                # 添加到文章列表
                self.article_list.append({
                    'title': metadata['title'],
                    'path': str(output_path).replace('\\', '/'),
                    'date': metadata.get('date', '2024-01-01'),
                    'type': metadata['type'],
                    'category_page': metadata['category_page']
                })
            
            # 转换Markdown为HTML
            html_content = self.md.convert(content)
            
            # 如果有链接处理器，添加反向链接
            if self.link_processor:
                backlinks = self.link_processor.get_backlinks(str(md_file))
                content = self.link_processor.add_backlinks_section(content, backlinks)
                html_content = self.md.convert(content)
            
            # 添加返回分类页面的导航
            if category in self.category_mapping:
                depth = len(relative_path.parts) - 1
                prefix = '../' * depth
                category_link = prefix + self.category_mapping[category]
                nav_html = f'''
                <div class="category-nav">
                    <a href="{category_link}" class="category-link">返回{category}列表</a>
                </div>
                '''
                html_content = nav_html + html_content
            
            return html_content
            
        except Exception as e:
            print(f"处理文件 {md_file} 时出错: {str(e)}")
            return None
            
    def generate_article_list(self) -> List[Dict]:
        """
        生成文章列表
        
        Returns:
            文章信息列表，每个文章包含title、link和date
        """
        # 确保日期格式一致
        def get_date(article):
            date = article['date']
            if isinstance(date, str):
                try:
                    return datetime.strptime(date, '%Y-%m-%d').date()
                except:
                    return datetime.now().date()
            return date
        
        # 按日期排序文章
        sorted_articles = sorted(self.article_list, key=get_date, reverse=True)
        
        # 转换为所需格式
        formatted_articles = []
        for article in sorted_articles:
            # 确保路径以html/开头并使用正斜杠
            path = article["path"].replace('\\', '/')
            if not path.startswith('html/'):
                path = 'html/' + path
            
            formatted_articles.append({
                'title': article["title"],
                'link': path,
                'date': article["date"]
            })
        
        return formatted_articles 