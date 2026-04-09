import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { DetailArchiveFeed } from '@/widgets/detail-page/archive/feed';

import '@testing-library/jest-dom/vitest';

vi.mock('@/shared/lib/react/use-cursor-pagination-feed', () => ({
  useCursorPaginationFeed: vi.fn(),
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
let requestAnimationFrameCallbacks: FrameRequestCallback[] = [];
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
const getUseCursorPaginationFeedMock = async () => {
  const feedModule = await import('@/shared/lib/react/use-cursor-pagination-feed');

  return vi.mocked(feedModule.useCursorPaginationFeed);
};

const loadPageActionMock = vi.fn();

describe('DetailArchiveFeed', () => {
  beforeEach(() => {
    observerCallback = null;
    requestAnimationFrameCallbacks = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      requestAnimationFrameCallbacks.push(callback);

      return requestAnimationFrameCallbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      value: class {
        constructor(callback: ObserverCallback) {
          observerCallback = callback;
        }

        disconnect() {}

        observe() {}
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('추가 로드 에러가 나면 자동 재시도를 멈추고 retry 버튼으로만 다시 요청한다', async () => {
    const useCursorPaginationFeed = await getUseCursorPaginationFeedMock();
    const loadMore = vi.fn();
    useCursorPaginationFeed.mockReturnValue({
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

    fireEvent.scroll(window);

    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(loadMore).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(screen.getByText('불러오기 실패')).toBeInTheDocument();
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('활성 항목을 viewport 상단 쪽 기준으로 한 번만 스크롤 정렬한다', async () => {
    const useCursorPaginationFeed = await getUseCursorPaginationFeedMock();
    useCursorPaginationFeed.mockImplementation(({ initialItems }) => ({
      errorMessage: null,
      hasMore: false,
      isLoadingMore: false,
      items: initialItems,
      loadMore: vi.fn(),
    }));

    const { container } = render(
      <DetailArchiveFeed<TestArchiveItem>
        activeItemViewportOffsetRatio={0.25}
        emptyText="비어 있음"
        hrefBasePath="/articles"
        initialPage={{
          items: [
            {
              created_at: '2026-03-12T00:00:00.000Z',
              description: '최신 글',
              id: 'article-2',
              publish_at: '2026-03-12T00:00:00.000Z',
              slug: 'article-2-slug',
              title: '최신 글',
            },
            {
              created_at: '2026-03-11T00:00:00.000Z',
              description: '그다음 글',
              id: 'article-1',
              publish_at: '2026-03-11T00:00:00.000Z',
              slug: 'article-1-slug',
              title: '그다음 글',
            },
            {
              created_at: '2026-03-10T00:00:00.000Z',
              description: '현재 글',
              id: 'current-article',
              publish_at: '2026-03-10T00:00:00.000Z',
              slug: 'current-article-slug',
              title: '현재 글',
            },
          ],
          nextCursor: 'cursor-1',
        }}
        loadErrorText="불러오기 실패"
        loadPageAction={loadPageActionMock}
        loadMoreEndText="끝"
        loadingText="불러오는 중"
        locale="ko"
        pinCurrentItemToTop={false}
        retryText="다시 시도"
        selectedPathSegment="current-article-slug"
      />,
    );

    const viewport = container.querySelector('[data-scroll-region="true"]') as HTMLElement;
    const scrollToMock = vi.fn();
    Object.defineProperty(viewport, 'clientHeight', {
      configurable: true,
      value: 400,
    });
    Object.defineProperty(viewport, 'scrollHeight', {
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(viewport, 'scrollTo', {
      configurable: true,
      value: scrollToMock,
    });

    const activeLink = screen.getByRole('link', { name: '2026년 현재 글 현재 글' });
    Object.defineProperty(activeLink, 'offsetTop', {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(activeLink, 'clientHeight', {
      configurable: true,
      value: 120,
    });
    requestAnimationFrameCallbacks.forEach(callback => callback(0));

    await waitFor(() => {
      expect(scrollToMock).toHaveBeenCalledWith({
        behavior: 'auto',
        top: 460,
      });
    });
  });
});
