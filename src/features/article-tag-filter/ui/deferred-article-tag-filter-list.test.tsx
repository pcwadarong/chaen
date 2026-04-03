import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { DeferredArticleTagFilterList } from '@/features/article-tag-filter/ui/deferred-article-tag-filter-list';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>
      {children}
    </a>
  ),
}));

describe('DeferredArticleTagFilterList', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    consoleErrorSpy.mockRestore();
  });

  it('초기에는 loading 상태를 보여주고 이후 태그 링크를 렌더링한다', async () => {
    let resolveFetch:
      | ((value: {
          json: () => Promise<
            Array<{
              article_count: number;
              label: string;
              tag: string;
            }>
          >;
          ok: true;
        }) => void)
      | null = null;

    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise(resolve => {
            resolveFetch = resolve;
          }),
      ),
    );

    await act(async () => {
      render(
        <DeferredArticleTagFilterList
          activeTag=""
          defaultLabel="전체"
          emptyText="비어 있음"
          loadingText="불러오는 중"
          locale="ko"
          title="인기 태그"
        />,
      );
    });

    expect(screen.getByText('불러오는 중')).toBeTruthy();

    await act(async () => {
      resolveFetch?.({
        json: async () => [
          {
            article_count: 2,
            label: 'Next.js',
            tag: 'nextjs',
          },
        ],
        ok: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Next\.js/ })).toBeTruthy();
    });
  });

  it('조회 실패 시에도 기본 전체 필터는 유지한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failed')));

    render(
      <DeferredArticleTagFilterList
        activeTag=""
        defaultLabel="전체"
        emptyText="비어 있음"
        loadingText="불러오는 중"
        locale="ko"
        title="인기 태그"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: '전체' }).getAttribute('href')).toBe('/articles');
    });
  });

  it('전체 태그 소스면 /api/tags를 호출하고 개수 없이 태그를 렌더링한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => [{ id: 'tag-1', label: '접근성', slug: 'a11y' }],
        ok: true,
      }),
    );

    render(
      <DeferredArticleTagFilterList
        activeTag=""
        defaultLabel="전체"
        emptyText="비어 있음"
        loadingText="불러오는 중"
        locale="ko"
        source="all"
        title="전체 태그"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: '접근성' }).getAttribute('href')).toBe(
        '/articles/tag/a11y',
      );
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/tags?locale=ko', {
      method: 'GET',
      signal: expect.any(AbortSignal),
    });
  });
});
