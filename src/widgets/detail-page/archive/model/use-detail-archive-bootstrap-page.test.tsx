import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createActionFailure, createActionSuccess } from '@/shared/lib/action/action-result';
import { useDetailArchiveBootstrapPage } from '@/widgets/detail-page/archive/model/use-detail-archive-bootstrap-page';

type TestArchiveItem = {
  created_at: string;
  description: string | null;
  id: string;
  publish_at: string;
  slug: string;
  title: string;
};

const createArchiveItem = (
  overrides: Partial<TestArchiveItem> & Pick<TestArchiveItem, 'id' | 'slug' | 'title'>,
): TestArchiveItem => ({
  created_at: '2026-03-10T00:00:00.000Z',
  description: null,
  publish_at: '2026-03-10T00:00:00.000Z',
  ...overrides,
});

type BootstrapHarnessProps = {
  currentItem: TestArchiveItem | null;
  pinCurrentItemToTop: boolean;
};

describe('useDetailArchiveBootstrapPage', () => {
  it('초기 페이지가 있으면 fetch 없이 현재 항목 병합 결과를 바로 노출해야 한다', () => {
    const loadPageAction = vi.fn();

    const { result } = renderHook(() =>
      useDetailArchiveBootstrapPage({
        currentItem: createArchiveItem({
          description: '현재 글',
          id: 'current-article',
          slug: 'current-article-slug',
          title: '현재 글',
        }),
        initialPage: {
          items: [
            createArchiveItem({
              description: '이전 글',
              id: 'article-1',
              slug: 'article-1-slug',
              title: '이전 글',
            }),
          ],
          nextCursor: 'cursor-1',
        },
        loadPageAction,
        locale: 'ko',
        pinCurrentItemToTop: true,
      }),
    );

    expect(loadPageAction).not.toHaveBeenCalled();
    expect(result.current.isBootstrapping).toBe(false);
    expect(result.current.bootstrapError).toBeNull();
    expect(result.current.bootstrapPage?.items.map(item => item.id)).toEqual([
      'current-article',
      'article-1',
    ]);
  });

  it('초기 페이지가 없으면 첫 페이지를 가져와 현재 항목 병합 결과를 채워야 한다', async () => {
    const currentItem = createArchiveItem({
      description: '현재 글',
      id: 'current-article',
      slug: 'current-article-slug',
      title: '현재 글',
    });
    const loadPageAction = vi.fn().mockResolvedValue(
      createActionSuccess({
        items: [
          createArchiveItem({
            description: '이전 글',
            id: 'article-1',
            slug: 'article-1-slug',
            title: '이전 글',
          }),
        ],
        nextCursor: 'cursor-1',
      }),
    );

    const { result } = renderHook(() =>
      useDetailArchiveBootstrapPage({
        currentItem,
        loadPageAction,
        locale: 'ko',
        pinCurrentItemToTop: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.isBootstrapping).toBe(false);
    });

    expect(loadPageAction).toHaveBeenCalledWith({
      cursor: null,
      limit: 10,
      locale: 'ko',
    });
    expect(result.current.bootstrapError).toBeNull();
    expect(result.current.bootstrapPage?.items.map(item => item.id)).toEqual([
      'current-article',
      'article-1',
    ]);
  });

  it('remote bootstrap이 끝난 뒤 현재 항목 병합 파라미터가 바뀌어도, useDetailArchiveBootstrapPage는 fetch를 다시 호출하지 않아야 한다', async () => {
    const loadPageAction = vi.fn().mockResolvedValue(
      createActionSuccess({
        items: [
          createArchiveItem({
            id: 'article-1',
            slug: 'article-1-slug',
            title: '이전 글',
          }),
        ],
        nextCursor: 'cursor-1',
      }),
    );

    const { rerender, result } = renderHook(
      ({ currentItem, pinCurrentItemToTop }: BootstrapHarnessProps) =>
        useDetailArchiveBootstrapPage({
          currentItem,
          loadPageAction,
          locale: 'ko',
          pinCurrentItemToTop,
        }),
      {
        initialProps: {
          currentItem: null,
          pinCurrentItemToTop: true,
        } as BootstrapHarnessProps,
      },
    );

    await waitFor(() => {
      expect(result.current.isBootstrapping).toBe(false);
    });

    rerender({
      currentItem: createArchiveItem({
        id: 'current-article',
        slug: 'current-article-slug',
        title: '현재 글',
      }),
      pinCurrentItemToTop: false,
    });

    expect(loadPageAction).toHaveBeenCalledTimes(1);
    expect(result.current.bootstrapPage?.items.map(item => item.id)).toEqual([
      'article-1',
      'current-article',
    ]);
  });

  it('bootstrap 실패 후 retry를 호출하면 다시 요청하고 에러를 복구해야 한다', async () => {
    const loadPageAction = vi
      .fn()
      .mockResolvedValueOnce(createActionFailure('불러오기 실패', 'detailArchive.loadFailed'))
      .mockResolvedValueOnce(
        createActionSuccess({
          items: [
            createArchiveItem({
              id: 'article-1',
              slug: 'article-1-slug',
              title: '복구된 글',
            }),
          ],
          nextCursor: null,
        }),
      );

    const { result } = renderHook(() =>
      useDetailArchiveBootstrapPage({
        loadPageAction,
        locale: 'ko',
        pinCurrentItemToTop: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.isBootstrapping).toBe(false);
      expect(result.current.bootstrapError).toBe('detailArchive.loadFailed');
    });

    act(() => {
      result.current.retryBootstrap();
    });

    await waitFor(() => {
      expect(result.current.isBootstrapping).toBe(false);
      expect(result.current.bootstrapError).toBeNull();
    });

    expect(loadPageAction).toHaveBeenCalledTimes(2);
    expect(result.current.bootstrapPage?.items.map(item => item.id)).toEqual(['article-1']);
  });
});
