import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { DetailArchiveFeed } from '@/shared/ui/detail-page/archive/feed';

import '@testing-library/jest-dom/vitest';

vi.mock('@/shared/lib/react/use-offset-pagination-feed', () => ({
  useOffsetPaginationFeed: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>
      {children}
    </a>
  ),
}));

type ObserverCallback = IntersectionObserverCallback;

let observerCallback: ObserverCallback | null = null;
let observerOptions: IntersectionObserverInit | null = null;
type TestArchiveItem = {
  created_at: string;
  description: string | null;
  id: string;
  publish_at: string;
  slug: string;
  title: string;
};

/**
 * 상세 아카이브 피드 훅 목을 반환합니다.
 */
const getUseOffsetPaginationFeedMock = async () => {
  const feedModule = await import('@/shared/lib/react/use-offset-pagination-feed');

  return vi.mocked(feedModule.useOffsetPaginationFeed);
};

const loadPageActionMock = vi.fn();

describe('DetailArchiveFeed', () => {
  beforeEach(() => {
    observerCallback = null;
    observerOptions = null;

    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      value: class {
        constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
          observerCallback = callback;
          observerOptions = options ?? null;
        }

        disconnect() {}

        observe() {}
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sidebar viewport를 observer root로 연결하고 스크롤 이후 sentinel 감지 시 추가 로드를 호출한다', async () => {
    const useOffsetPaginationFeed = await getUseOffsetPaginationFeedMock();
    const loadMore = vi.fn();
    useOffsetPaginationFeed.mockReturnValue({
      errorMessage: null,
      hasMore: true,
      isLoadingMore: false,
      items: [
        {
          created_at: '2025-12-31T00:00:00.000Z',
          description: '요약',
          id: 'article-1',
          publish_at: '2026-03-08T00:00:00.000Z',
          slug: 'article-1-slug',
          title: '첫 글',
        },
      ] satisfies TestArchiveItem[],
      loadMore,
    });

    const { container } = render(
      <DetailArchiveFeed<TestArchiveItem>
        emptyText="비어 있음"
        hrefBasePath="/articles"
        initialPage={{ items: [] as TestArchiveItem[], nextCursor: 'cursor-1' }}
        loadErrorText="불러오기 실패"
        loadPageAction={loadPageActionMock}
        loadMoreEndText="끝"
        loadingText="불러오는 중"
        locale="ko"
        retryText="다시 시도"
        selectedPathSegment="article-1-slug"
      />,
    );

    expect(screen.getByRole('link', { name: '2026년 첫 글 요약' })).toHaveAttribute(
      'href',
      '/articles/article-1-slug',
    );
    expect(screen.getByText('2026년')).toBeInTheDocument();
    expect(observerOptions?.root).toBe(container.querySelector('[data-scroll-region="true"]'));

    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(loadMore).not.toHaveBeenCalled();

    fireEvent.scroll(window);

    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('추가 로드 에러가 나면 자동 재시도를 멈추고 retry 버튼으로만 다시 요청한다', async () => {
    const useOffsetPaginationFeed = await getUseOffsetPaginationFeedMock();
    const loadMore = vi.fn();
    useOffsetPaginationFeed.mockReturnValue({
      errorMessage: 'load failed',
      hasMore: true,
      isLoadingMore: false,
      items: [
        {
          created_at: '2026-03-08T00:00:00.000Z',
          description: '요약',
          id: 'article-1',
          publish_at: '2026-03-08T00:00:00.000Z',
          slug: 'article-1-slug',
          title: '첫 글',
        },
      ] satisfies TestArchiveItem[],
      loadMore,
    });

    render(
      <DetailArchiveFeed<TestArchiveItem>
        emptyText="비어 있음"
        hrefBasePath="/articles"
        initialPage={{ items: [] as TestArchiveItem[], nextCursor: 'cursor-1' }}
        loadErrorText="불러오기 실패"
        loadPageAction={loadPageActionMock}
        loadMoreEndText="끝"
        loadingText="불러오는 중"
        locale="ko"
        retryText="다시 시도"
        selectedPathSegment="article-1-slug"
      />,
    );

    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(loadMore).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(screen.getByText('불러오기 실패')).toBeInTheDocument();
    expect(loadMore).toHaveBeenCalledTimes(1);
  });
});
