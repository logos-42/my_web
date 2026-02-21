
import ThemeToggle from '../ThemeToggle/ThemeToggle';

const socialLinks = [
  { label: 'GitHub', url: 'https://github.com/logos-42' },
  { label: 'Firefly', url: 'https://firefly.social/profile/lens/logos42' },
  { label: 'Twitter/X', url: 'https://x.com/canopylist' },
  { label: 'Paragraph', url: 'https://paragraph.com/dashboard/@logos-42' },
  { label: 'Theme', component: 'toggle' },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-links">
        {socialLinks.map(item => (
          'url' in item ? (
            <a 
              key={item.label}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="header-link"
            >
              {item.label}
            </a>
          ) : (
            <ThemeToggle key="theme-toggle" />
          )
        ))}
      </div>
    </header>
  );
}
