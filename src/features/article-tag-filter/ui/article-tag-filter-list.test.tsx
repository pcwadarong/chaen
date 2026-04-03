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

  it('활성 태그는 태그 전용 경로로 연결되고 aria-current를 표시한다', () => {
    render(
      <ArticleTagFilterList
        activeTag="nextjs"
        defaultLabel="전체"
        emptyText="비어 있음"
        items={[
          { articleCount: 4, label: 'Next.js', tag: 'nextjs' },
          { articleCount: 2, label: 'React', tag: 'react' },
        ]}
        title="tags"
      />,
    );

    const allLink = screen.getByText('전체').closest('a');
    const nextjsLink = screen.getByText('Next.js').closest('a');
    const reactLink = screen.getByText('React').closest('a');

    expect(allLink?.getAttribute('href')).toBe('/articles');
    expect(nextjsLink?.getAttribute('href')).toBe('/articles?tag=nextjs');
    expect(nextjsLink?.getAttribute('aria-current')).toBe('page');
    expect(reactLink?.getAttribute('href')).toBe('/articles?tag=react');
  });

  it('같은 props로 다시 그리면 태그 링크를 다시 렌더링하지 않는다', () => {
    const props = {
      activeTag: 'nextjs',
      defaultLabel: '전체',
      emptyText: '비어 있음',
      items: [
        { articleCount: 4, label: 'Next.js', tag: 'nextjs' },
        { articleCount: 2, label: 'React', tag: 'react' },
      ],
      title: 'tags',
    } as const;

    const rendered = render(<ArticleTagFilterList {...props} />);

    expect(linkRenderSpy).toHaveBeenCalledTimes(3);

    rendered.rerender(<ArticleTagFilterList {...props} />);

    expect(linkRenderSpy).toHaveBeenCalledTimes(3);
  });

  it('pending 상태면 loading text를 렌더링한다', () => {
    render(
      <ArticleTagFilterList
        activeTag=""
        defaultLabel="전체"
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
        defaultLabel="전체"
        emptyText="비어 있음"
        items={[{ articleCount: 4, label: 'Next.js', tag: 'nextjs' }]}
        onNavigationStart={onNavigationStart}
        title="tags"
      />,
    );

    fireEvent.click(screen.getByRole('link', { name: /Next\.js/ }));

    expect(onNavigationStart).toHaveBeenCalledWith({
      nextTag: 'nextjs',
    });
  });

  it('인기 태그 목록에 없는 활성 태그는 별도 항목으로 주입하지 않는다', () => {
    render(
      <ArticleTagFilterList
        activeTag="threejs"
        defaultLabel="전체"
        emptyText="비어 있음"
        items={[{ articleCount: 4, label: 'Next.js', tag: 'nextjs' }]}
        title="인기 태그"
      />,
    );

    expect(screen.queryByText('threejs')).toBeNull();
    expect(screen.getByText('Next.js').closest('a')?.getAttribute('aria-current')).toBeNull();
  });

  it('태그 페이지 모드면 태그 전용 경로를 사용한다', () => {
    render(
      <ArticleTagFilterList
        activeTag="react"
        defaultLabel="전체"
        emptyText="비어 있음"
        hrefMode="tag-page"
        itemDivider="dot"
        items={[{ label: 'React', tag: 'react' }]}
        title="전체 태그"
      />,
    );

    expect(screen.getByText('React').closest('a')?.getAttribute('href')).toBe(
      '/articles/tag/react',
    );
  });

  it('전체 태그 모드면 항목 사이에 구분점을 렌더링한다', () => {
    render(
      <ArticleTagFilterList
        activeTag=""
        defaultLabel="전체"
        emptyText="비어 있음"
        hrefMode="tag-page"
        itemDivider="dot"
        items={[
          { label: 'React', tag: 'react' },
          { label: 'Next.js', tag: 'nextjs' },
        ]}
        title="전체 태그"
      />,
    );

    expect(screen.getAllByText('·')).toHaveLength(2);
  });
});
