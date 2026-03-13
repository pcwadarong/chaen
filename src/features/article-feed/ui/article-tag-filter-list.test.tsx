import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ArticleTagFilterList } from './article-tag-filter-list';

const linkRenderSpy = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    linkRenderSpy(href);

    return (
      <a href={typeof href === 'string' ? href : ''} {...props}>
        {children}
      </a>
    );
  },
}));

describe('ArticleTagFilterList', () => {
  beforeEach(() => {
    linkRenderSpy.mockClear();
  });

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

  it('같은 props로 다시 그리면 태그 링크를 다시 렌더링하지 않는다', () => {
    const props = {
      activeTag: 'nextjs',
      emptyText: '비어 있음',
      items: [
        { article_count: 4, label: 'Next.js', tag: 'nextjs' },
        { article_count: 2, label: 'React', tag: 'react' },
      ],
      title: 'tags',
    } as const;

    const rendered = render(<ArticleTagFilterList {...props} />);

    expect(linkRenderSpy).toHaveBeenCalledTimes(2);

    rendered.rerender(<ArticleTagFilterList {...props} />);

    expect(linkRenderSpy).toHaveBeenCalledTimes(2);
  });
});
