'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // 更新body的class来控制布局
  useEffect(() => {
    const layout = document.querySelector('.layout');
    if (layout) {
      if (isCollapsed) {
        layout.classList.add('sidebar-collapsed');
      } else {
        layout.classList.remove('sidebar-collapsed');
      }
    }
  }, [isCollapsed]);

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/essays', label: '随笔' },
    { href: '/blog', label: '博客' },
    { href: '/projects', label: '新奇项目' },
    { href: '/articles', label: '文章' },
    { href: '/philosophy', label: '哲科' },
    { href: '/music', label: '音乐' },
    { href: '/art', label: '绘画' },
    { href: '/wechat', label: '公众号' },
  ];

  return (
    <>
      <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <button 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          aria-label="切换侧边栏"
        >
          <span className="toggle-icon"></span>
        </button>

        <div className="nav-section">
          {navItems.map((item) => (
            <div key={item.href} className="nav-item">
              <Link 
                href={item.href} 
                className={pathname === item.href ? 'active' : ''}
              >
                {item.label}
              </Link>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
