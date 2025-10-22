"""
链接处理器模块
负责处理文档间的链接关系
"""

import re
from pathlib import Path
from typing import Dict, Set, List

class LinkProcessor:
    def __init__(self, config: dict):
        """
        初始化链接处理器
        
        Args:
            config: 配置字典
        """
        self.config = config
        self.backlinks = {}  # 存储反向链接关系
        
    def get_backlinks(self, file_path: str) -> Set[str]:
        """
        获取指向特定文件的反向链接
        
        Args:
            file_path: 文件路径
            
        Returns:
            指向该文件的文件路径集合
        """
        return self.backlinks.get(file_path, set())
        
    def add_backlinks_section(self, content: str, backlinks: Set[str]) -> str:
        """
        在Markdown内容中添加反向链接部分
        
        Args:
            content: 原始Markdown内容
            backlinks: 反向链接集合
            
        Returns:
            添加了反向链接部分的Markdown内容
        """
        if not backlinks:
            return content
            
        backlinks_section = "\n## 相关文章\n\n### 引用本文的文章\n\n"
        for link in sorted(backlinks):
            # 从文件路径中提取标题
            title = Path(link).stem.replace('-', ' ').title()
            # 使用相对于html目录的路径
            html_link = Path(link).name
            backlinks_section += f"- [{title}]({html_link})\n"
            
        # 检查是否已存在反向链接部分
        if "## 相关文章" in content:
            # 使用正则表达式替换现有的反向链接部分
            content = re.sub(
                r"## 相关文章\n+### 引用本文的文章\n+(?:[^#]+(?:\n|$))*",
                backlinks_section,
                content
            )
        else:
            # 在文件末尾添加反向链接部分
            content = content.rstrip() + "\n\n" + backlinks_section
            
        return content 