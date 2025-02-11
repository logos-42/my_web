"""
文件监控器模块
负责监控文件变化、维护文件索引
"""

import os
import time
from pathlib import Path
from typing import Dict, List, Set
from datetime import datetime, timedelta

class FileMonitor:
    def __init__(self, config: dict):
        """
        初始化文件监控器
        
        Args:
            config: 配置字典，包含必要的路径和设置
        """
        self.config = config
        self.file_index: Dict[Path, float] = {}  # 文件路径到最后修改时间的映射
        self.last_scan_time = datetime.now()
        
    def scan_files(self) -> List[Path]:
        """
        扫描文件变化
        
        Returns:
            新增或修改的文件列表
        """
        current_time = datetime.now()
        self.last_scan_time = current_time
        changed_files = []
        
        # 获取Markdown文件目录
        md_dir = Path(self.config['paths']['markdown_dir'])
        
        # 扫描所有Markdown文件
        for md_file in md_dir.rglob('*.md'):
            mtime = md_file.stat().st_mtime
            
            # 检查文件是否是新的或已修改
            if md_file not in self.file_index or self.file_index[md_file] < mtime:
                changed_files.append(md_file)
                self.file_index[md_file] = mtime
                
        return changed_files
        
    def get_all_files(self) -> Set[Path]:
        """
        获取所有已索引的文件
        
        Returns:
            所有文件路径的集合
        """
        return set(self.file_index.keys())
        
    def remove_deleted_files(self):
        """
        从索引中移除已删除的文件
        """
        deleted_files = []
        
        for file_path in self.file_index:
            if not file_path.exists():
                deleted_files.append(file_path)
                
        for file_path in deleted_files:
            del self.file_index[file_path]
            
    def is_file_changed(self, file_path: Path) -> bool:
        """
        检查指定文件是否有变化
        
        Args:
            file_path: 文件路径
            
        Returns:
            如果文件有变化返回True，否则返回False
        """
        if not file_path.exists():
            return False
            
        current_mtime = file_path.stat().st_mtime
        last_mtime = self.file_index.get(file_path, 0)
        
        return current_mtime > last_mtime 