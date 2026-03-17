import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { GlobalNav } from '@/widgets/global-nav/ui/global-nav';

import '@testing-library/jest-dom/vitest';

const globalNavMockState = vi.hoisted(() => ({
  desktopRenderCount: 0,
  pathname: '/articles',
  searchParams: new URLSearchParams('q=hello'),
}));

const buildNavigationItemsMock = vi.hoisted(() =>
  vi.fn().mockReturnValue([
    { href: '/', label: 'Home' },
    { href: '/articles', label: 'Articles' },
  ]),
);

vi.mock('next/navigation', () => ({
  useSearchParams: () => globalNavMockState.searchParams,
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    href,
    prefetch: _prefetch,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: () => globalNavMockState.pathname,
}));

vi.mock('@/shared/providers', () => ({
  useAuth: () => ({
    isAdmin: false,
  }),
}));

vi.mock('@/widgets/global-nav/ui/build-navigation-items', () => ({
  buildGlobalNavigationItems: buildNavigationItemsMock,
}));

vi.mock('@/widgets/global-nav/ui/global-nav-desktop-content', () => {
  const DesktopContentBase = () => {
    globalNavMockState.desktopRenderCount += 1;
    return <div>desktop-content</div>;
  };

  return {
    GlobalNavDesktopContent: React.memo(DesktopContentBase),
  };
});

vi.mock('@/widgets/global-nav/ui/global-nav-mobile-menu', () => {
  const MobileMenuBase = ({
    leadingAction,
    onClose,
    onToggle,
  }: {
    leadingAction?: React.ReactNode;
    onClose: () => void;
    onToggle: () => void;
  }) => (
    <div>
      {leadingAction}
      <button onClick={onToggle} type="button">
        menu-toggle
      </button>
      <button onClick={onClose} type="button">
        menu-close
      </button>
    </div>
  );

  return {
    GlobalNavMobileMenu: React.memo(MobileMenuBase),
  };
});

vi.mock('@/features/article-search/ui/article-search-form', () => ({
  ArticleSearchForm: ({ onSubmitComplete }: { onSubmitComplete?: () => void }) => (
    <div>
      <p>search-form</p>
      <button onClick={onSubmitComplete} type="button">
        search-submit-complete
      </button>
    </div>
  ),
}));

describe('GlobalNav', () => {
  beforeEach(() => {
    globalNavMockState.desktopRenderCount = 0;
    globalNavMockState.pathname = '/articles';
    globalNavMockState.searchParams = new URLSearchParams('q=hello');

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      })),
      writable: true,
    });

    Object.defineProperty(document, 'querySelector', {
      configurable: true,
      value: vi.fn().mockReturnValue(null),
      writable: true,
    });
  });

  it('모바일 검색 overlay를 열고 닫아도 desktop content를 다시 그리지 않는다', async () => {
    render(<GlobalNav />);

    expect(buildNavigationItemsMock).toHaveBeenCalledTimes(1);
    expect(globalNavMockState.desktopRenderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Articles.searchSubmit' }));

    expect(screen.getByText('search-form')).toBeTruthy();
    expect(buildNavigationItemsMock).toHaveBeenCalledTimes(1);
    expect(globalNavMockState.desktopRenderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'search-submit-complete' }));

    await waitFor(() => {
      expect(screen.queryByText('search-form')).toBeNull();
    });

    expect(buildNavigationItemsMock).toHaveBeenCalledTimes(1);
    expect(globalNavMockState.desktopRenderCount).toBe(1);
  });
});
