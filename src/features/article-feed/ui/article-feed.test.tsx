import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ArticleFeed } from '@/features/article-feed/ui/article-feed';

import '@testing-library/jest-dom/vitest';

vi.mock('@/features/article-feed/model/use-article-feed', () => ({
  useArticleFeed: vi.fn(),
}));

vi.mock('@/entities/article/ui/article-card', () => ({
  ArticleCard: ({ article }: { article: { title: string } }) => <article>{article.title}</article>,
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
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      value: class {
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
          created_at: '2026-03-08T00:00:00.000Z',
          description: '설명',
          id: 'article-1',
          thumbnail_url: null,
          title: '테스트 아티클',
        },
      ],
      loadMore: vi.fn(),
    });

    render(
      <ArticleFeed
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
    const styleText = endMessage.getAttribute('style') ?? '';

    expect(endMessage).toHaveAttribute('aria-live', 'polite');
    expect(styleText).toContain('position: absolute');
    expect(styleText).toContain('width: 1px');
    expect(styleText).toContain('height: 1px');
    expect(styleText).toContain('clip: rect(0px, 0px, 0px, 0px)');
  });
});
