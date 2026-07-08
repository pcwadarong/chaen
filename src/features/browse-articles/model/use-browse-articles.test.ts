// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import type { ArticleListItem } from '@/entities/article/model/types';
import { useBrowseArticles } from '@/features/browse-articles/model/use-browse-articles';
import { createQueryClientWrapper } from '@/shared/lib/test/render-with-query-client';

/**
 * 테스트용 아티클 목록 항목을 생성합니다.
 *
 * @param id 항목 id입니다.
 * @returns 최소 필드만 채운 아티클 목록 항목입니다.
 */
const createArticleListItem = (id: string): ArticleListItem => ({
  description: `${id} 설명`,
  id,
  publish_at: '2026-03-08T00:00:00.000Z',
  slug: id,
  thumbnail_url: null,
  title: `${id} 제목`,
});

/**
 * `fetch` 응답을 흉내 내는 최소 객체를 만듭니다.
 *
 * @param ok 응답 성공 여부입니다.
 * @param body JSON 본문입니다.
 * @returns `fetch`가 반환하는 Response 유사 객체입니다.
 */
const createFetchResponse = (ok: boolean, body: unknown) =>
  ({
    json: async () => body,
    ok,
  }) as Response;

describe('useBrowseArticles', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('서버 시드가 주어지면, useBrowseArticles는 추가 fetch 없이 시드 목록을 렌더한다', () => {
    const fetchSpy = vi.spyOn(window, 'fetch');

    const { result } = renderHook(
      () =>
        useBrowseArticles({
          activeTag: '',
          initialCursor: null,
          initialItems: [createArticleListItem('article-1')],
          locale: 'ko',
          query: '',
        }),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.id).toBe('article-1');
    expect(result.current.hasMore).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('다음 커서가 있을 때 loadMore를 호출하면, useBrowseArticles는 다음 페이지를 한 번만 조회해 이어붙인다', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      createFetchResponse(true, {
        items: [createArticleListItem('article-2')],
        nextCursor: null,
      }),
    );

    const { result } = renderHook(
      () =>
        useBrowseArticles({
          activeTag: '',
          initialCursor: 'cursor-1',
          initialItems: [createArticleListItem('article-1')],
          locale: 'ko',
          query: '',
        }),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.items.map(item => item.id)).toEqual(['article-1', 'article-2']);
    });
    expect(result.current.hasMore).toBe(false);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('다음 페이지 조회가 실패하면, useBrowseArticles는 errorMessage를 노출하고 기존 목록을 유지한다', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      createFetchResponse(false, { error: 'articleFeed.loadFailed' }),
    );

    const { result } = renderHook(
      () =>
        useBrowseArticles({
          activeTag: '',
          initialCursor: 'cursor-1',
          initialItems: [createArticleListItem('article-1')],
          locale: 'ko',
          query: '',
        }),
      { wrapper: createQueryClientWrapper() },
    );

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('articleFeed.loadFailed');
    });
    expect(result.current.items.map(item => item.id)).toEqual(['article-1']);
    expect(result.current.hasMore).toBe(true);
  });

  it('쿼리 키가 바뀌면(locale 변경), useBrowseArticles는 새 서버 시드로 목록을 초기화한다', () => {
    const fetchSpy = vi.spyOn(window, 'fetch');

    const { result, rerender } = renderHook(
      (props: {
        activeTag: string;
        initialCursor: string | null;
        initialItems: ArticleListItem[];
        locale: string;
        query: string;
      }) => useBrowseArticles(props),
      {
        initialProps: {
          activeTag: '',
          initialCursor: null,
          initialItems: [createArticleListItem('article-ko')],
          locale: 'ko',
          query: '',
        },
        wrapper: createQueryClientWrapper(),
      },
    );

    expect(result.current.items.map(item => item.id)).toEqual(['article-ko']);

    rerender({
      activeTag: '',
      initialCursor: null,
      initialItems: [createArticleListItem('article-en')],
      locale: 'en',
      query: '',
    });

    expect(result.current.items.map(item => item.id)).toEqual(['article-en']);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
