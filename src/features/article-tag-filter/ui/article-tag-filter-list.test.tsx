import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ArticleTagFilterList } from '@/features/article-tag-filter/ui/article-tag-filter-list';

const linkRenderSpy = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    linkRenderSpy(href);

    return (
      <a
        href={typeof href === 'string' ? href : ''}
        {...props}
        onClick={event => {
          event.preventDefault();
          props.onClick?.(event);
        }}
      >
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

  it('pending 상태면 loading text를 렌더링한다', () => {
    render(
      <ArticleTagFilterList
        activeTag=""
        emptyText="비어 있음"
        items={[]}
        loadingText="불러오는 중"
        pending
        title="tags"
      />,
    );

    expect(screen.getByText('불러오는 중')).toBeTruthy();
  });

  it('태그 링크를 클릭하면 상위에 이동 시작을 알린다', () => {
    const onNavigationStart = vi.fn();

    render(
      <ArticleTagFilterList
        activeTag=""
        emptyText="비어 있음"
        items={[{ article_count: 4, label: 'Next.js', tag: 'nextjs' }]}
        onNavigationStart={onNavigationStart}
        title="tags"
      />,
    );

    fireEvent.click(screen.getByRole('link', { name: /Next\.js/ }));

    expect(onNavigationStart).toHaveBeenCalledWith({
      nextTag: 'nextjs',
    });
  });
});
