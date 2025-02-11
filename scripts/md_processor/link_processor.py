"""
链接处理器模块
负责链接的提取、验证、修复和反向链接生成
"""

import re
from pathlib import Path
from typing import Dict, List, Set, Tuple
from difflib import SequenceMatcher

class LinkProcessor:
    def __init__(self, config: dict):
        """
        初始化链接处理器
        
        Args:
            config: 配置字典，包含必要的路径和设置
        """
        self.config = config
        self.link_graph: Dict[str, Set[str]] = {}
        self.backlinks: Dict[str, Set[str]] = {}
        
    def extract_links(self, content: str) -> List[str]:
        """
        从内容中提取所有链接
        
        Args:
            content: Markdown或HTML内容
            
        Returns:
            提取到的链接列表
        """
        # Markdown链接模式：[text](url)
        md_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
        # HTML链接模式：<a href="url">text</a>
        html_pattern = r'<a[^>]+href=["\'](.*?)["\']'
        
        links = []
        # 提取Markdown链接
        md_links = re.findall(md_pattern, content)
        links.extend([link[1] for link in md_links])  # 只保留链接部分
        # 提取HTML链接
        html_links = re.findall(html_pattern, content)
        links.extend(html_links)
        
        return list(set(links))
        
    def validate_links(self, links: List[str], base_path: Path) -> Tuple[List[str], List[str]]:
        """
        验证链接的有效性
        
        Args:
            links: 链接列表
            base_path: 基础路径
            
        Returns:
            有效链接和无效链接的元组
        """
        valid_links = []
        invalid_links = []
        
        for link in links:
            # 移除html/前缀
            if link.startswith('html/'):
                link = link[5:]
            target_path = base_path / link
                
            if target_path.exists():
                valid_links.append(link)
            else:
                invalid_links.append(link)
                
        return valid_links, invalid_links
        
    def fix_invalid_links(self, invalid_links: List[str], base_path: Path) -> Dict[str, str]:
        """
        尝试修复无效链接
        
        Args:
            invalid_links: 无效链接列表
            base_path: 基础路径
            
        Returns:
            原始链接到修复后链接的映射
        """
        fixes = {}
        all_files = list(base_path.rglob('*.html'))  # 获取所有HTML文件
        
        for invalid_link in invalid_links:
            best_match = None
            best_ratio = 0
            
            # 获取无效链接的文件名部分
            invalid_name = Path(invalid_link).name
            
            # 寻找最佳匹配
            for file_path in all_files:
                ratio = SequenceMatcher(None, invalid_name, file_path.name).ratio()
                if ratio > best_ratio and ratio > 0.8:  # 设置相似度阈值
                    best_ratio = ratio
                    best_match = file_path
                    
            if best_match:
                # 使用相对于html目录的路径
                fixed_link = best_match.name
                fixes[invalid_link] = fixed_link
                
        return fixes
        
    def update_link_graph(self, source_file: str, links: List[str]):
        """
        更新链接关系图
        
        Args:
            source_file: 源文件路径
            links: 该文件中的链接列表
        """
        self.link_graph[source_file] = set(links)
        self._update_backlinks()
        
    def _update_backlinks(self):
        """
        更新反向链接关系
        """
        self.backlinks.clear()
        
        # 遍历所有链接关系
        for source, targets in self.link_graph.items():
            for target in targets:
                # 移除html/前缀
                if target.startswith('html/'):
                    target = target[5:]
                if target not in self.backlinks:
                    self.backlinks[target] = set()
                self.backlinks[target].add(source)
                
    def get_backlinks(self, target_file: str) -> Set[str]:
        """
        获取指定文件的反向链接
        
        Args:
            target_file: 目标文件路径
            
        Returns:
            指向该文件的所有文件路径集合
        """
        return self.backlinks.get(target_file, set())
        
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