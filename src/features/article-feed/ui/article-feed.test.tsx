import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ArticleFeed } from '@/features/article-feed/ui/article-feed';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

import '@testing-library/jest-dom/vitest';

const articleFeedMockState = vi.hoisted(() => ({
  listItemRenderCount: 0,
}));

type ObserverCallback = IntersectionObserverCallback;

let observerCallback: ObserverCallback | null = null;

vi.mock('@/features/article-feed/model/use-article-feed', () => ({
  useArticleFeed: vi.fn(),
}));

vi.mock('@/entities/article/ui/article-list-item', () => ({
  ArticleListItem: ({ article }: { article: { title: string } }) => {
    articleFeedMockState.listItemRenderCount += 1;
    return <article>{article.title}</article>;
  },
}));

/**
 * 아티클 피드 훅 목을 반환합니다.
 */
const getUseArticleFeedMock = async () => {
  const articleFeedModule = await import('@/features/article-feed/model/use-article-feed');

  return vi.mocked(articleFeedModule.useArticleFeed);
};

describe('ArticleFeed', () => {
  beforeEach(() => {
    articleFeedMockState.listItemRenderCount = 0;
    observerCallback = null;
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

  it('마지막 안내 문구를 스크린리더 전용 상태 텍스트로 렌더링한다', async () => {
    const useArticleFeed = await getUseArticleFeedMock();
    useArticleFeed.mockReturnValue({
      errorMessage: null,
      hasMore: false,
      isLoadingMore: false,
      items: [
        {
          description: '설명',
          id: 'article-1',
          publish_at: '2026-03-08T00:00:00.000Z',
          slug: 'article-1',
          thumbnail_url: null,
          title: '테스트 아티클',
        },
      ],
      loadMore: vi.fn(),
    });

    render(
      <ArticleFeed
        activeTag=""
        emptyText="비어 있음"
        initialCursor={null}
        initialItems={[]}
        loadErrorText="불러오기 실패"
        loadMoreEndText="마지막 아티클까지 확인했습니다."
        loadingText="불러오는 중"
        locale="ko"
        query=""
        retryText="다시 시도"
      />,
    );

    const endMessage = screen.getByText('마지막 아티클까지 확인했습니다.');

    expect(endMessage).toHaveAttribute('aria-live', 'polite');
    expect(endMessage).toHaveClass(srOnlyClass);
  });

  it('loading 상태만 바뀌면 기존 리스트 아이템을 다시 그리지 않는다', async () => {
    const useArticleFeed = await getUseArticleFeedMock();
    const items = [
      {
        description: '설명',
        id: 'article-1',
        publish_at: '2026-03-08T00:00:00.000Z',
        slug: 'article-1',
        thumbnail_url: null,
        title: '테스트 아티클',
      },
    ];

    useArticleFeed.mockReturnValue({
      errorMessage: null,
      hasMore: true,
      isLoadingMore: false,
      items,
      loadMore: vi.fn(),
    });

    const { rerender } = render(
      <ArticleFeed
        activeTag=""
        emptyText="비어 있음"
        initialCursor={null}
        initialItems={[]}
        loadErrorText="불러오기 실패"
        loadMoreEndText="마지막 아티클까지 확인했습니다."
        loadingText="불러오는 중"
        locale="ko"
        query=""
        retryText="다시 시도"
      />,
    );

    expect(articleFeedMockState.listItemRenderCount).toBe(1);

    useArticleFeed.mockReturnValue({
      errorMessage: null,
      hasMore: true,
      isLoadingMore: true,
      items,
      loadMore: vi.fn(),
    });

    rerender(
      <ArticleFeed
        activeTag=""
        emptyText="비어 있음"
        initialCursor={null}
        initialItems={[]}
        loadErrorText="불러오기 실패"
        loadMoreEndText="마지막 아티클까지 확인했습니다."
        loadingText="불러오는 중"
        locale="ko"
        query=""
        retryText="다시 시도"
      />,
    );

    expect(articleFeedMockState.listItemRenderCount).toBe(1);
  });

  it('초기 intersection만으로는 추가 로드를 시작하지 않고 스크롤 이후에만 자동 로드한다', async () => {
    const useArticleFeed = await getUseArticleFeedMock();
    const loadMore = vi.fn();
    useArticleFeed.mockReturnValue({
      errorMessage: null,
      hasMore: true,
      isLoadingMore: false,
      items: [
        {
          description: '설명',
          id: 'article-1',
          publish_at: '2026-03-08T00:00:00.000Z',
          slug: 'article-1',
          thumbnail_url: null,
          title: '테스트 아티클',
        },
      ],
      loadMore,
    });

    render(
      <ArticleFeed
        activeTag=""
        emptyText="비어 있음"
        initialCursor="cursor-1"
        initialItems={[]}
        loadErrorText="불러오기 실패"
        loadMoreEndText="마지막 아티클까지 확인했습니다."
        loadingText="불러오는 중"
        locale="ko"
        query=""
        retryText="다시 시도"
      />,
    );

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
});
