import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ProjectFeed } from '@/features/project-feed/ui/project-feed';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

import '@testing-library/jest-dom/vitest';

const projectFeedMockState = vi.hoisted(() => ({
  showcaseRenderCount: 0,
}));

vi.mock('@/features/project-feed/model/use-project-feed', () => ({
  useProjectFeed: vi.fn(),
}));

vi.mock('@/widgets/project-showcase/ui/project-showcase', () => ({
  ProjectShowcase: ({ items }: { items: Array<{ title: string }> }) => {
    projectFeedMockState.showcaseRenderCount += 1;
    return <div>{items.map(item => item.title).join(', ')}</div>;
  },
}));

/**
 * 프로젝트 피드 훅 목을 반환합니다.
 */
const getUseProjectFeedMock = async () => {
  const projectFeedModule = await import('@/features/project-feed/model/use-project-feed');

  return vi.mocked(projectFeedModule.useProjectFeed);
};

describe('ProjectFeed', () => {
  beforeEach(() => {
    projectFeedMockState.showcaseRenderCount = 0;
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
    const useProjectFeed = await getUseProjectFeedMock();
    useProjectFeed.mockReturnValue({
      errorMessage: null,
      hasMore: false,
      isLoadingMore: false,
      items: [
        {
          description: '설명',
          id: 'project-1',
          publish_at: '2026-03-08T00:00:00.000Z',
          slug: 'project-1',
          thumbnail_url: null,
          title: '테스트 프로젝트',
        },
      ],
      loadMore: vi.fn(),
    });

    render(
      <ProjectFeed
        emptyText="비어 있음"
        initialCursor={null}
        initialItems={[]}
        loadErrorText="불러오기 실패"
        loadMoreEndText="모든 프로젝트를 확인했습니다."
        loadingText="불러오는 중"
        locale="ko"
        retryText="다시 시도"
      />,
    );

    const endMessage = screen.getByText('모든 프로젝트를 확인했습니다.');

    expect(endMessage).toHaveAttribute('aria-live', 'polite');
    expect(endMessage).toHaveClass(srOnlyClass);
  });

  it('loading 상태만 바뀌면 기존 프로젝트 쇼케이스를 다시 그리지 않는다', async () => {
    const useProjectFeed = await getUseProjectFeedMock();
    const items = [
      {
        description: '설명',
        id: 'project-1',
        publish_at: '2026-03-08T00:00:00.000Z',
        slug: 'project-1',
        thumbnail_url: null,
        title: '테스트 프로젝트',
      },
    ];

    useProjectFeed.mockReturnValue({
      errorMessage: null,
      hasMore: true,
      isLoadingMore: false,
      items,
      loadMore: vi.fn(),
    });

    const { rerender } = render(
      <ProjectFeed
        emptyText="비어 있음"
        initialCursor={null}
        initialItems={[]}
        loadErrorText="불러오기 실패"
        loadMoreEndText="모든 프로젝트를 확인했습니다."
        loadingText="불러오는 중"
        locale="ko"
        retryText="다시 시도"
      />,
    );

    expect(projectFeedMockState.showcaseRenderCount).toBe(1);

    useProjectFeed.mockReturnValue({
      errorMessage: null,
      hasMore: true,
      isLoadingMore: true,
      items,
      loadMore: vi.fn(),
    });

    rerender(
      <ProjectFeed
        emptyText="비어 있음"
        initialCursor={null}
        initialItems={[]}
        loadErrorText="불러오기 실패"
        loadMoreEndText="모든 프로젝트를 확인했습니다."
        loadingText="불러오는 중"
        locale="ko"
        retryText="다시 시도"
      />,
    );

    expect(projectFeedMockState.showcaseRenderCount).toBe(1);
  });
});
