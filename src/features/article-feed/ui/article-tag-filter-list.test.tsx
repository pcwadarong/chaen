import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ArticleTagFilterList } from './article-tag-filter-list';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>
      {children}
    </a>
  ),
}));

describe('ArticleTagFilterList', () => {
  it('활성 태그는 기본 목록 href로 되돌리고 aria-current를 표시한다', () => {
    render(
      <ArticleTagFilterList
        activeTag="nextjs"
        emptyText="비어 있음"
        items={[
          { article_count: 4, label: 'Next.js', tag: 'nextjs' },
          { article_count: 2, label: 'React', tag: 'react' },
        ]}
        title="tags"
      />,
    );

    const nextjsLink = screen.getByText('Next.js').closest('a');
    const reactLink = screen.getByText('React').closest('a');

    expect(nextjsLink?.getAttribute('href')).toBe('/articles');
    expect(nextjsLink?.getAttribute('aria-current')).toBe('page');
    expect(reactLink?.getAttribute('href')).toBe('/articles?tag=react');
  });
});
