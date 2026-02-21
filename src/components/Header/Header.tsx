
import ThemeToggle from '../ThemeToggle/ThemeToggle';

const socialLinks = [
  { label: 'GitHub', url: 'https://github.com/logos-42', icon: '⌘' },
  { label: 'Firefly', url: 'https://firefly.social/profile/lens/logos42', icon: '🦋' },
  { label: 'Twitter/X', url: 'https://x.com/canopylist', icon: '𝕏' },
  { label: 'Paragraph', url: 'https://paragraph.com/dashboard/@logos-42', icon: '📝' },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-links">
        {socialLinks.map(link => (
          <a 
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="header-link"
          >
            {link.label}
          </a>
        ))}
      </div>
      <ThemeToggle />
    </header>
  );
}
