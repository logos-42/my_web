document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('nav-toggle');
    const sidebar = document.querySelector('.sidebar');
    const layout = document.querySelector('.layout');
    const content = document.querySelector('.content');
    
    // 从 localStorage 获取导航栏状态
    const isNavCollapsed = localStorage.getItem('navCollapsed') === 'true';
    if (isNavCollapsed) {
        sidebar.classList.add('collapsed');
        layout.classList.add('nav-collapsed');
        toggleBtn.classList.add('collapsed');
    }
    
    toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        layout.classList.toggle('nav-collapsed');
        toggleBtn.classList.toggle('collapsed');
        
        // 保存导航栏状态到 localStorage
        localStorage.setItem('navCollapsed', sidebar.classList.contains('collapsed'));
    });
}); 