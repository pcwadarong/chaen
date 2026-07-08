import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { createQueryClientWrapper } from '@/shared/lib/test/render-with-query-client';
import { DetailArchiveFeed } from '@/widgets/detail-page/archive/feed';

import '@testing-library/jest-dom/vitest';

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
 * 테스트용 아카이브 항목을 생성합니다.
 *
 * @param id 항목 id입니다.
 * @param overrides 덮어쓸 필드입니다.
 * @returns 아카이브 항목입니다.
 */
const createArchiveItem = (
  id: string,
  overrides: Partial<TestArchiveItem> = {},
): TestArchiveItem => ({
  created_at: '2026-03-08T00:00:00.000Z',
  description: `${id} 요약`,
  id,
  publish_at: '2026-03-08T00:00:00.000Z',
  slug: `${id}-slug`,
  title: `${id} 제목`,
  ...overrides,
});

/**
 * `DetailArchiveFeed`를 React Query 래퍼로 감싸 렌더링합니다.
 *
 * @param ui 렌더링할 엘리먼트입니다.
 * @returns Testing Library 렌더 결과입니다.
 */
const renderWithQueryClient = (ui: React.ReactElement) =>
  render(ui, { wrapper: createQueryClientWrapper() });

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

  it('추가 로드가 실패하면 자동 재시도를 멈추고 retry 버튼으로만 다시 요청한다', async () => {
    const loadPageAction = vi.fn().mockResolvedValue({
      errorCode: 'load failed',
      ok: false,
    });

    renderWithQueryClient(
      <DetailArchiveFeed<TestArchiveItem>
        emptyText="비어 있음"
        hrefBasePath="/articles"
        initialPage={{ items: [createArchiveItem('article-1')], nextCursor: 'cursor-1' }}
        loadErrorText="불러오기 실패"
        loadPageAction={loadPageAction}
        loadMoreEndText="끝"
        loadingText="불러오는 중"
        locale="ko"
        retryText="다시 시도"
        selectedPathSegment="article-1-slug"
      />,
    );

    expect(screen.getByRole('link', { name: /article-1 제목/ })).toBeInTheDocument();

    // 스크롤 의도를 보인 뒤 sentinel 교차로 첫 추가 로드를 트리거합니다.
    fireEvent.scroll(window);
    await act(async () => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    await waitFor(() => {
      expect(loadPageAction).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('불러오기 실패')).toBeInTheDocument();

    // 에러 상태에서는 sentinel 교차가 다시 발생해도 자동 재요청하지 않습니다.
    await act(async () => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(loadPageAction).toHaveBeenCalledTimes(1);

    // retry 버튼으로만 다시 요청합니다.
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    await waitFor(() => {
      expect(loadPageAction).toHaveBeenCalledTimes(2);
    });
  });

  it('활성 항목을 viewport 상단 쪽 기준으로 한 번만 스크롤 정렬한다', async () => {
    const loadPageAction = vi.fn();

    const { container } = renderWithQueryClient(
      <DetailArchiveFeed<TestArchiveItem>
        activeItemViewportOffsetRatio={0.25}
        emptyText="비어 있음"
        hrefBasePath="/articles"
        initialPage={{
          items: [
            createArchiveItem('article-2', {
              description: '최신 글',
              publish_at: '2026-03-12T00:00:00.000Z',
              slug: 'article-2-slug',
              title: '최신 글',
            }),
            createArchiveItem('article-1', {
              description: '그다음 글',
              publish_at: '2026-03-11T00:00:00.000Z',
              slug: 'article-1-slug',
              title: '그다음 글',
            }),
            createArchiveItem('current-article', {
              description: '현재 글',
              publish_at: '2026-03-10T00:00:00.000Z',
              slug: 'current-article-slug',
              title: '현재 글',
            }),
          ],
          nextCursor: 'cursor-1',
        }}
        loadErrorText="불러오기 실패"
        loadPageAction={loadPageAction}
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
