import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ArticleSearchForm } from '@/features/article-feed/ui/article-search-form';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>
      {children}
    </a>
  ),
}));

describe('ArticleSearchForm', () => {
  it('검색어가 있으면 초기화 액션을 링크로 렌더링한다', () => {
    render(
      <ArticleSearchForm
        clearText="초기화"
        placeholder="검색어 입력"
        searchQuery="next"
        submitText="검색"
      />,
    );

    const clearLink = screen.getByRole('link', { name: '초기화' });

    expect(screen.getByRole('button', { name: '검색' })).toBeTruthy();
    expect(clearLink.getAttribute('href')).toBe('/articles');
    expect(screen.queryByRole('button', { name: '초기화' })).toBeNull();
  });
});
