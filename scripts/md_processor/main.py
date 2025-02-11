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
from .markdown_processor import MarkdownProcessor
from .link_processor import LinkProcessor

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
    
    # 获取所有Markdown文件
    md_files = []
    for pattern in config['markdown_patterns']:
        md_files.extend(markdown_dir.rglob(pattern))
    
    # 返回所有文件，强制重新生成
    return md_files

def update_index_page(processor: MarkdownProcessor, config: dict):
    """
    更新首页
    
    Args:
        processor: Markdown处理器实例
        config: 配置字典
    """
    # 创建Jinja2环境
    env = Environment(
        loader=FileSystemLoader('templates')
    )
    
    try:
        # 加载主页模板
        template = env.get_template('index.html')
        
        # 生成文章列表
        article_list = processor.generate_article_list()
        
        # 渲染模板
        content = template.render(article_list=article_list)
        
        # 保存更新后的首页
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(content)
            
        logger.info("成功更新首页")
        
    except Exception as e:
        logger.error(f"更新首页时出错: {str(e)}")
        
def main():
    """
    主程序入口
    """
    try:
        # 加载配置
        config = load_config()
        
        # 获取需要处理的文件
        modified_files = get_modified_files(config)
        logger.info(f"发现 {len(modified_files)} 个新的或修改的文件")
        
        if not modified_files:
            logger.info("没有需要处理的文件")
            return
            
        # 创建链接处理器
        link_processor = LinkProcessor(config)
        
        # 创建Markdown处理器
        processor = MarkdownProcessor(config, link_processor)
        
        # 处理每个文件
        for md_file in modified_files:
            logger.info(f"处理文件: {md_file}")
            
            # 生成HTML内容
            html_content = processor.process_file(md_file)
            if not html_content:
                continue
                
            # 确定输出路径
            html_dir = Path(config['html_dir'])
            relative_path = md_file.relative_to(Path(config['markdown_dir']))
            html_file = html_dir / relative_path.with_suffix('.html')
            
            # 确保输出目录存在
            html_file.parent.mkdir(parents=True, exist_ok=True)
            
            # 写入HTML文件
            with html_file.open('w', encoding='utf-8') as f:
                f.write(html_content)
            logger.info(f"成功生成HTML文件: {html_file}")
            
        # 更新首页
        update_index_page(processor, config)
        
    except Exception as e:
        logger.error(f"程序执行出错: {str(e)}")
        sys.exit(1)
        
if __name__ == '__main__':
    main() 