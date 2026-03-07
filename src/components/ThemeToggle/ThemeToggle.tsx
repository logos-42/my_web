import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗夜模式'}
      title={theme === 'dark' ? '亮色模式' : '暗夜模式'}
    >
      <img 
        src={theme === 'dark' ? '/images/night.png' : '/images/day.png'} 
        alt={theme === 'dark' ? '夜间' : '日间'}
        style={{ width: '20px', height: '20px' }}
      />
    </button>
  );
}
