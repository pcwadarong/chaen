import Link from 'next/link';
import type { CSSProperties } from 'react';

const navigationItems = [
  { href: '/', label: 'Main' },
  { href: '/guest', label: 'Guest' },
  { href: '/blog', label: 'Blog' },
  { href: '/work', label: 'Work' },
] as const;

/** 전역 네비게이션 위젯입니다. */
export const GlobalNav = () => (
  <header style={headerStyle}>
    <div style={innerStyle}>
      <Link href="/" style={brandLinkStyle}>
        chaen
      </Link>
      <nav aria-label="Primary navigation">
        <ul style={listStyle}>
          {navigationItems.map(item => (
            <li key={item.href}>
              <Link href={item.href} style={navLinkStyle}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </header>
);

const headerStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  backgroundColor: 'rgb(var(--grayscale-2) / 0.72)',
  borderBottom: '1px solid rgb(var(--grayscale-7) / 0.08)',
};

const innerStyle: CSSProperties = {
  width: 'min(1120px, calc(100% - 2rem))',
  margin: '0 auto',
  padding: '1rem 0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  flexWrap: 'wrap',
};

const brandLinkStyle: CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textDecoration: 'none',
  color: 'inherit',
};

const listStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

const navLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '2.25rem',
  padding: '0 0.75rem',
  borderRadius: '999px',
  border: '1px solid transparent',
  fontSize: '0.95rem',
  letterSpacing: '0.04em',
  textDecoration: 'none',
  color: 'inherit',
};
