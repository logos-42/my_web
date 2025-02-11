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
from jinja2 import Template, Environment, FileSystemLoader

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
        
        # 使用项目根目录的模板
        templates_dir = Path(config['markdown_dir']).parent / 'templates'
        self.env = Environment(
            loader=FileSystemLoader(templates_dir)
        )
        # 加载不同类型的模板
        self.templates = {
            'article': self.env.get_template('article.html'),
            'blog': self.env.get_template('blog.html'),
            'page': self.env.get_template('page.html'),
            'default': self.env.get_template('default.html')
        }
        self.article_list = []
        
    def _fix_links(self, content: str, md_file: Path) -> str:
        """
        修正HTML内容中的链接路径
        
        Args:
            content: HTML内容
            md_file: 当前处理的Markdown文件路径
            
        Returns:
            修正后的HTML内容
        """
        # 计算当前文件相对于根目录的深度
        depth = len(md_file.relative_to(Path(self.config['markdown_dir'])).parts) - 1
        prefix = '../' * depth if depth > 0 else ''
        
        def fix_internal_link(match):
            link = match.group(1)
            if link.startswith('/'):
                link = link[1:]  # 移除开头的斜杠
            if link.startswith('html/'):
                link = link[5:]  # 移除html/前缀
            return f'href="{prefix}{link}"'
            
        # 修正所有链接
        content = re.sub(r'href="([^"]+)"', fix_internal_link, content)
        
        # 修正图片链接
        content = re.sub(r'src="([^"]+\.(jpg|png|gif))"', rf'src="{prefix}\1"', content)
        
        return content
        
    def _fix_markdown_links(self, content: str) -> str:
        """
        修正Markdown内容中的链接
        
        Args:
            content: Markdown内容
            
        Returns:
            修正后的Markdown内容
        """
        # 修正Markdown链接
        content = re.sub(r'\]\((?!http)([^)]+)\.md\)', r'](html/\1.html)', content)
        content = re.sub(r'\]\((?!http)([^)]+)\.html\)', r'](html/\1.html)', content)
        
        return content
        
    def _get_template(self, md_file: Path, metadata: Dict) -> Template:
        """
        根据文件路径和元数据选择合适的模板
        
        Args:
            md_file: Markdown文件路径
            metadata: 文档元数据
            
        Returns:
            对应的模板
        """
        # 从元数据中获取类型
        page_type = metadata.get('type', '')
        if page_type:
            return self.templates.get(page_type, self.templates['default'])
            
        # 根据文件路径判断类型
        relative_path = md_file.relative_to(Path(self.config['markdown_dir']))
        parts = relative_path.parts
        
        if len(parts) > 1:
            if parts[0] == 'articles':
                return self.templates['article']
            elif parts[0] == 'blogs':
                return self.templates['blog']
                
        # 如果是基础页面（如about.md, projects.md等）
        if len(parts) == 1 and not parts[0].startswith('_'):
            return self.templates['page']
            
        return self.templates['default']
        
    def _apply_template(self, content: str, metadata: Dict, md_file: Path) -> str:
        """
        将HTML内容应用到模板中
        
        Args:
            content: HTML内容
            metadata: 文档元数据
            md_file: 当前处理的Markdown文件路径
            
        Returns:
            完整的HTML页面
        """
        # 计算当前文件相对于根目录的深度
        depth = len(md_file.relative_to(Path(self.config['markdown_dir'])).parts) - 1
        prefix = '../' * depth if depth > 0 else ''
        
        # 准备模板变量
        template_vars = {
            'title': metadata.get('title', 'Untitled'),
            'content': content,
            'prefix': prefix,
            **metadata  # 添加其他元数据
        }
        
        # 选择合适的模板
        template = self._get_template(md_file, metadata)
        
        # 应用模板
        return template.render(**template_vars)
        
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
            
            # 修正Markdown内容中的链接
            content = self._fix_markdown_links(content)
            
            # 如果有链接处理器，添加反向链接
            if self.link_processor:
                # 获取当前文件的反向链接
                backlinks = self.link_processor.get_backlinks(str(md_file))
                # 添加反向链接部分
                content = self.link_processor.add_backlinks_section(content, backlinks)
            
            # 转换Markdown为HTML
            html_content = self.md.convert(content)
            
            # 应用HTML模板
            html_content = self._apply_template(html_content, metadata, md_file)
            
            # 修正链接路径
            html_content = self._fix_links(html_content, md_file)
            
            # 添加到文章列表
            if 'title' in metadata:
                # 计算相对于html目录的路径
                relative_path = md_file.relative_to(Path(self.config['markdown_dir']))
                html_path = str(relative_path).replace('.md', '.html')
                self.article_list.append({
                    'title': metadata['title'],
                    'path': f"html/{html_path}",
                    'date': metadata.get('date', '2024-01-01')
                })
            
            return html_content
            
        except Exception as e:
            print(f"处理文件 {md_file} 时出错: {str(e)}")
            return None
            
    def generate_article_list(self) -> str:
        """
        生成文章列表HTML
        
        Returns:
            文章列表的HTML字符串
        """
        # 按日期排序文章
        sorted_articles = sorted(self.article_list, key=lambda x: x['date'], reverse=True)
        
        # 生成HTML列表
        html_list = []
        for article in sorted_articles:
            html_list.append(f'<li><a href="{article["path"]}">{article["title"]}</a> - {article["date"]}</li>')
        
        return '\n'.join(html_list)
        
    def batch_process(self, md_files: List[Path]) -> Dict[Path, str]:
        """
        批量处理Markdown文件
        
        Args:
            md_files: Markdown文件路径列表
            
        Returns:
            文件路径到HTML内容的映射
        """
        results = {}
        for md_file in md_files:
            html_content = self.process_file(md_file)
            if html_content:
                results[md_file] = html_content
        return results 