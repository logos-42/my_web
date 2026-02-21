import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? '切换到暗夜模式' : '切换到亮色模式'}
      title={theme === 'light' ? '暗夜模式' : '亮色模式'}
    >
      {theme === 'light' ? '夜间' : '日间'}
    </button>
  );
}
