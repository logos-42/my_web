#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
画廊自动启动脚本
自动启动本地HTTP服务器并在浏览器中打开art.html页面
"""

import os
import sys
import time
import webbrowser
import http.server
import socketserver
import threading
from pathlib import Path
import socket

# 配置
SERVER_DIR = os.path.dirname(os.path.abspath(__file__))  # 当前目录作为服务器根目录
PORT = None  # 端口号将在运行时动态分配
TARGET_PAGE = "art.html"  # 目标页面

def check_finish_folder():
    """检查finish文件夹是否存在，如果不存在则创建"""
    finish_dir = os.path.join(SERVER_DIR, "finish")
    if not os.path.exists(finish_dir):
        print(f"创建finish文件夹: {finish_dir}")
        os.makedirs(finish_dir)
        print("请将图片放入finish文件夹后重新运行此脚本")
        sys.exit(1)
    
    # 检查文件夹中是否有图片
    files = [f for f in os.listdir(finish_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif'))]
    if not files:
        print("finish文件夹中没有图片文件")
        print("请将图片放入finish文件夹后重新运行此脚本")
        sys.exit(1)
    
    print(f"finish文件夹中找到 {len(files)} 个图片文件")
    return True

def check_art_html():
    """检查art.html是否存在并包含必要的脚本引用"""
    art_path = os.path.join(SERVER_DIR, TARGET_PAGE)
    
    if not os.path.exists(art_path):
        print(f"错误: 找不到 {TARGET_PAGE} 文件")
        sys.exit(1)
    
    with open(art_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否包含gallery-loader.js和gallery.js的引用
    if 'gallery-loader.js' not in content:
        print(f"警告: {TARGET_PAGE} 中没有引用 gallery-loader.js")
        update_art_html(art_path, content)
    else:
        print(f"{TARGET_PAGE} 中已包含 gallery-loader.js 引用")
    
    return True

def update_art_html(art_path, content):
    """更新art.html，添加必要的脚本引用"""
    print(f"正在更新 {TARGET_PAGE} 添加必要的脚本引用...")
    
    # 如果缺少gallery-loader.js引用，添加它
    if 'gallery-loader.js' not in content:
        # 在</body>标签之前添加脚本引用
        if '</body>' in content:
            new_content = content.replace('</body>', 
                                        '    <script src="js/gallery-loader.js"></script>\n'
                                        '    <script src="js/gallery.js"></script>\n'
                                        '</body>')
            
            with open(art_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
                
            print(f"{TARGET_PAGE} 已更新，添加了必要的脚本引用")
        else:
            print(f"警告: 无法在 {TARGET_PAGE} 中找到</body>标签，无法自动添加脚本引用")
            print("请手动在HTML文件底部添加以下行:")
            print('    <script src="js/gallery-loader.js"></script>')
            print('    <script src="js/gallery.js"></script>')

def find_available_port(start_port=8000, max_attempts=10):
    """查找可用的端口"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    raise OSError(f"无法找到可用端口 (尝试范围: {start_port}-{start_port + max_attempts - 1})")

def start_server():
    """启动HTTP服务器"""
    os.chdir(SERVER_DIR)  # 切换到服务器根目录
    
    # 查找可用端口
    try:
        global PORT
        PORT = find_available_port()
        print(f"使用端口: {PORT}")
    except OSError as e:
        print(f"错误: {e}")
        sys.exit(1)
    
    handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("", PORT), handler)
    
    print(f"服务器启动在 http://localhost:{PORT}")
    print("按Ctrl+C终止服务器")
    
    # 启动服务器
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
        httpd.shutdown()

def open_browser():
    """在浏览器中打开目标页面"""
    time.sleep(1)  # 等待服务器启动
    target_url = f"http://localhost:{PORT}/{TARGET_PAGE}"
    print(f"在浏览器中打开 {target_url}")
    webbrowser.open(target_url)

def main():
    """主函数"""
    print("=" * 60)
    print("画廊自动启动脚本")
    print("=" * 60)
    
    # 检查环境
    check_finish_folder()
    check_art_html()
    
    # 启动服务器线程
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True  # 设置为守护线程，这样主程序退出时它也会退出
    server_thread.start()
    
    # 在浏览器中打开页面
    open_browser()
    
    # 保持主线程运行
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n程序已退出")

if __name__ == "__main__":
    main() 