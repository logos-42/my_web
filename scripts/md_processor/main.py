"""
主程序模块
负责程序的整体流程控制
"""

import os
import sys
import yaml
import logging
from pathlib import Path
from typing import List, Dict, Set
from datetime import datetime
from jinja2 import Template, Environment, FileSystemLoader
from markdown_processor import MarkdownProcessor
from link_processor import LinkProcessor
import frontmatter

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_config() -> dict:
    """
    加载配置文件
    
    Returns:
        配置字典
    """
    try:
        config_path = Path(__file__).parent.parent.parent / 'config.yaml'
        if not config_path.exists():
            config_path = Path('config.yaml')
            
        if not config_path.exists():
            raise FileNotFoundError("找不到配置文件 config.yaml")
            
        with config_path.open('r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
            
        # 确保路径是绝对路径
        base_dir = config_path.parent
        config['markdown_dir'] = str(base_dir / config['markdown_dir'].strip('./'))
        config['html_dir'] = str(base_dir / config['html_dir'].strip('./'))
        config['log_dir'] = str(base_dir / config['log_dir'].strip('./'))
        
        return config
    except Exception as e:
        logger.error(f"加载配置文件时出错: {str(e)}")
        raise

def get_modified_files(config: dict) -> List[Path]:
    """
    获取需要处理的Markdown文件列表
    
    Args:
        config: 配置字典
        
    Returns:
        需要处理的文件路径列表
    """
    markdown_dir = Path(config['markdown_dir'])
    html_dir = Path(config['html_dir'])
    
    # 确保输出目录存在
    html_dir.mkdir(exist_ok=True)
    
    # 获取特定目录下的Markdown文件
    md_files = []
    content_dirs = ['articles', 'blogs', 'projects', 'art', 'music', 'philosophy']
    
    # 遍历每个内容目录
    for content_dir in content_dirs:
        dir_path = markdown_dir / content_dir
        if dir_path.exists():
            # 获取目录下的所有markdown文件
            dir_files = []
            for pattern in config['markdown_patterns']:
                dir_files.extend(list(dir_path.glob(pattern)))
            
            # 将该目录的文件添加到总列表
            md_files.extend(dir_files)
    
    # 返回所有文件
    return sorted(md_files, key=lambda x: x.name.lower())

def replace_articles_section(index_content: str, new_articles: str) -> str:
    """
    在index.html中替换文章列表部分
    
    Args:
        index_content: 原index.html内容
        new_articles: 新的文章列表HTML
        
    Returns:
        更新后的index.html内容
    """
    start_marker = '<div class="essays-list">'
    end_marker = '</div> <!-- essays-list end -->'
    
    start_pos = index_content.find(start_marker)
    end_pos = index_content.find(end_marker, start_pos)
    
    if start_pos == -1 or end_pos == -1:
        raise ValueError("无法在index.html中找到文章列表区域")
        
    # 组合新的内容
    return (
        index_content[:start_pos + len(start_marker)]
        + new_articles
        + index_content[end_pos:]
    )

def update_index_page(processor: MarkdownProcessor, config: dict):
    """
    更新首页
    
    Args:
        processor: Markdown处理器实例
        config: 配置字典
    """
    try:
        # 获取项目根目录
        root_dir = Path(__file__).parent.parent.parent
        
        # 读取现有的index.html
        index_path = root_dir / 'index.html'
        with open(index_path, 'r', encoding='utf-8') as f:
            index_content = f.read()
            
        # 生成文章列表HTML
        articles_html = []
        
        # 直接使用已排序的文章列表
        for article in processor.generate_article_list():
            # 修改链接路径，确保指向html目录
            article_link = f"html/{article['link']}" if not article['link'].startswith('html/') else article['link']
            article_html = f'''
                    <div class="essay-item">
                        <a href="{article_link}" class="essay-title">{article['title']}</a>
                        <span class="essay-date">{article['date']}</span>
                    </div>'''
            articles_html.append(article_html)
            
        # 在index中定位文章列表位置并替换
        articles_section = '\n'.join(articles_html)
        new_content = replace_articles_section(index_content, articles_section)
        
        # 保存更新后的index
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        logger.info(f"成功更新首页: {index_path}")
        
    except Exception as e:
        logger.error(f"更新首页时出错: {str(e)}")
        
def process_markdown_files(config: dict):
    """
    处理所有Markdown文件
    
    Args:
        config: 配置字典
    """
    try:
        # 创建处理器实例
        link_processor = LinkProcessor(config)
        md_processor = MarkdownProcessor(config, link_processor)
        
        # 获取需要处理的文件
        md_files = get_modified_files(config)
        
        # 获取项目根目录
        root_dir = Path(__file__).parent.parent.parent
        html_base_dir = root_dir / 'html'  # 修改：使用html目录作为基础输出目录
        
        # 清空文章列表
        md_processor.articles = []
        
        # 首先收集所有文件的信息
        for md_file in md_files:
            try:
                with open(md_file, 'r', encoding='utf-8') as f:
                    post = frontmatter.load(f)
                metadata = post.metadata
                
                # 添加到文章列表
                md_processor.articles.append({
                    'title': metadata.get('title', '无标题'),
                    'date': metadata.get('date', datetime.now().strftime('%Y-%m-%d')),
                    'link': str(md_file.relative_to(Path(config['markdown_dir']))).replace('\\', '/').replace('.md', '.html'),
                    'file_path': md_file
                })
            except Exception as e:
                logger.error(f"读取文件 {md_file} 元数据时出错: {str(e)}")
                continue
        
        # 然后处理所有文件
        for article in md_processor.articles:
            try:
                md_file = article['file_path']
                # 计算输出路径
                rel_path = md_file.relative_to(Path(config['markdown_dir']))
                output_path = html_base_dir / rel_path.with_suffix('.html')
                
                # 确保输出目录存在
                output_path.parent.mkdir(parents=True, exist_ok=True)
                
                # 处理文件
                html_content = md_processor.process_file(md_file)
                if html_content:
                    # 写入HTML文件
                    with output_path.open('w', encoding='utf-8') as f:
                        f.write(html_content)
                    logger.info(f"已处理: {md_file} -> {output_path}")
                    
            except Exception as e:
                logger.error(f"处理文件 {md_file} 时出错: {str(e)}")
                continue
                
        # 更新索引页面
        update_index_page(md_processor, config)
        
    except Exception as e:
        logger.error(f"处理Markdown文件时出错: {str(e)}")
        raise

def main():
    """
    主程序入口
    """
    try:
        # 加载配置
        config = load_config()
        
        # 处理所有Markdown文件
        process_markdown_files(config)
        
    except Exception as e:
        logger.error(f"程序执行出错: {str(e)}")
        sys.exit(1)
        
if __name__ == '__main__':
    main() 