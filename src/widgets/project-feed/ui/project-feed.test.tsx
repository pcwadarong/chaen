import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';
import { ProjectFeed } from '@/widgets/project-feed/ui/project-feed';

import '@testing-library/jest-dom/vitest';

type ObserverCallback = IntersectionObserverCallback;

let observerCallback: ObserverCallback | null = null;

vi.mock('@/features/browse-projects/model/use-browse-projects', () => ({
  useBrowseProjects: vi.fn(),
}));

vi.mock('@/widgets/project-showcase/ui/project-showcase', () => ({
  ProjectShowcase: ({ items }: { items: Array<{ title: string }> }) => (
    <div>{items.map(item => item.title).join(', ')}</div>
  ),
}));

/**
 * 프로젝트 피드 훅 목을 반환합니다.
 */
const getUseBrowseProjectsMock = async () => {
  const projectFeedModule = await import('@/features/browse-projects/model/use-browse-projects');

  return vi.mocked(projectFeedModule.useBrowseProjects);
};

describe('ProjectFeed', () => {
  beforeEach(() => {
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
    const useBrowseProjects = await getUseBrowseProjectsMock();
    useBrowseProjects.mockReturnValue({
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

  it('loading 상태가 바뀌어도 이미 렌더링된 프로젝트 항목은 계속 보인다', async () => {
    const useBrowseProjects = await getUseBrowseProjectsMock();
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

    useBrowseProjects.mockReturnValue({
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

    expect(screen.getByText('테스트 프로젝트')).toBeTruthy();

    useBrowseProjects.mockReturnValue({
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

    expect(screen.getByText('테스트 프로젝트')).toBeTruthy();
  });

  it('초기 intersection만으로는 추가 로드를 시작하지 않고 스크롤 이후에만 자동 로드한다', async () => {
    const useBrowseProjects = await getUseBrowseProjectsMock();
    const loadMore = vi.fn();
    useBrowseProjects.mockReturnValue({
      errorMessage: null,
      hasMore: true,
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
      loadMore,
    });

    render(
      <ProjectFeed
        emptyText="비어 있음"
        initialCursor="cursor-1"
        initialItems={[]}
        loadErrorText="불러오기 실패"
        loadMoreEndText="모든 프로젝트를 확인했습니다."
        loadingText="불러오는 중"
        locale="ko"
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
