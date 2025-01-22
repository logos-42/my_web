// 侧边栏切换功能
document.addEventListener('DOMContentLoaded', function() {
    // 获取元素
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.querySelector('.sidebar-toggle');
    
    // 检查元素是否存在
    if (!sidebar || !toggleButton) {
        console.error('Sidebar elements not found');
        return;
    }

    // 初始化侧边栏状态
    const initSidebar = () => {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        }
    };

    // 切换侧边栏状态
    const toggleSidebar = (event) => {
        event.stopPropagation(); // 阻止事件冒泡
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    };

    // 添加事件监听
    toggleButton.addEventListener('click', toggleSidebar);
    
    // 初始化
    initSidebar();

    // 在移动设备上点击内容区域时自动收起侧边栏
    if (window.innerWidth <= 768) {
        const content = document.querySelector('.content');
        if (content) {
            content.addEventListener('click', () => {
                sidebar.classList.add('collapsed');
                localStorage.setItem('sidebarCollapsed', 'true');
            });
        }
    }
});
