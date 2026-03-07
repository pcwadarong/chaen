import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ProjectFeed } from '@/features/project-feed/ui/project-feed';

import '@testing-library/jest-dom/vitest';

vi.mock('@/features/project-feed/model/use-project-feed', () => ({
  useProjectFeed: vi.fn(),
}));

vi.mock('@/widgets/project-showcase/ui/project-showcase', () => ({
  ProjectShowcase: ({ items }: { items: Array<{ title: string }> }) => (
    <div>{items.map(item => item.title).join(', ')}</div>
  ),
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
          created_at: '2026-03-08T00:00:00.000Z',
          description: '설명',
          id: 'project-1',
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
    const styleText = endMessage.getAttribute('style') ?? '';

    expect(endMessage).toHaveAttribute('aria-live', 'polite');
    expect(styleText).toContain('position: absolute');
    expect(styleText).toContain('width: 1px');
    expect(styleText).toContain('height: 1px');
    expect(styleText).toContain('clip: rect(0px, 0px, 0px, 0px)');
  });
});
