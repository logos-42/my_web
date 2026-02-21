import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
}

export default function Sidebar({ onToggle }: SidebarProps) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onToggle?.(newState);
  };

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', isCollapsed);
  }, [isCollapsed]);

  const navItems = [
    { path: '/', label: '首页' },
    { path: '/essays', label: '随笔' },
    { path: '/blog', label: '博客' },
    { path: '/projects', label: '新奇项目' },
    { path: '/podcast', label: '播客' },
    { path: '/philosophy', label: '哲科' },
    { path: '/music', label: '音乐' },
    { path: '/art', label: '绘画' },
    { path: '/wechat', label: '公众号' },
  ];

  return (
    <>
      {/* 展开按钮 - 只在侧边栏收起时显示 */}
      <button
        className={`sidebar-expand-btn ${isCollapsed ? 'visible' : ''}`}
        onClick={toggleSidebar}
        aria-label="展开侧边栏"
        title="展开侧边栏"
      >
        <img 
          src="/images/方向-收缩-右.png" 
          alt="展开" 
          className="toggle-arrow"
        />
      </button>

      <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* 切换按钮 - 侧边栏内部顶部 */}
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
          title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          <img 
            src={isCollapsed ? "/images/方向-收缩-右.png" : "/images/方向-收缩-左.png"} 
            alt={isCollapsed ? "展开" : "收起"} 
            className="toggle-arrow"
          />
        </button>

        <div className="nav-section">
          {navItems.map((item) => (
            <div key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
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
