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
          emptyText="비어 있음"
          loadingText="불러오는 중"
          locale="ko"
          title="tags"
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

  it('조회 실패 시 empty 상태로 폴백한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failed')));

    render(
      <DeferredArticleTagFilterList
        activeTag=""
        emptyText="비어 있음"
        loadingText="불러오는 중"
        locale="ko"
        title="tags"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('비어 있음')).toBeTruthy();
    });
  });
});
