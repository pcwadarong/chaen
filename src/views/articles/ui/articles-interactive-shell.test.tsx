import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ArticlesInteractiveShell } from '@/views/articles/ui/articles-interactive-shell';

import '@testing-library/jest-dom/vitest';

vi.mock('@/features/article-search/ui/article-search-form', () => ({
  ArticleSearchForm: ({ onPendingChange }: { onPendingChange?: (isPending: boolean) => void }) => (
    <button onClick={() => onPendingChange?.(true)} type="button">
      start-pending
    </button>
  ),
}));

vi.mock('@/widgets/article-feed/ui/article-feed', () => ({
  ArticleFeed: () => <div>article-feed</div>,
}));

vi.mock('@/features/article-tag-filter/ui/deferred-article-tag-filter-list', () => ({
  DeferredArticleTagFilterList: ({
    onNavigationStart,
  }: {
    onNavigationStart?: (nextState: { nextTag: string }) => void;
  }) => (
    <button onClick={() => onNavigationStart?.({ nextTag: 'nextjs' })} type="button">
      start-tag-pending
    </button>
  ),
}));

describe('ArticlesInteractiveShell', () => {
  it('검색 pending 중에는 목록 대신 피드 스켈레톤을 보여준다', () => {
    render(
      <ArticlesInteractiveShell
        activeTag=""
        emptyText="비어 있음"
        feedLocale="ko"
        initialCursor={null}
        initialItems={[]}
        loadErrorText="에러"
        loadMoreEndText="끝"
        loadingText="로딩"
        popularTagsDefaultLabel="전체"
        popularTagsEmptyText="없음"
        popularTagsLoadingText="태그 로딩"
        popularTagsTitle="인기 태그"
        query=""
        retryText="재시도"
        searchClearText="초기화"
        searchPlaceholderText="검색"
        searchSubmitText="검색"
        tagLocale="ko"
      />,
    );

    expect(screen.getByText('article-feed')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'start-pending' }));

    expect(screen.queryByText('article-feed')).toBeNull();
    expect(screen.getByRole('status', { name: '로딩' })).toHaveAttribute('aria-busy', 'true');
  });

  it('태그 클릭 신호가 오면 목록 대신 피드 스켈레톤을 보여준다', () => {
    render(
      <ArticlesInteractiveShell
        activeTag=""
        emptyText="비어 있음"
        feedLocale="ko"
        initialCursor={null}
        initialItems={[]}
        loadErrorText="에러"
        loadMoreEndText="끝"
        loadingText="로딩"
        popularTagsDefaultLabel="전체"
        popularTagsEmptyText="없음"
        popularTagsLoadingText="태그 로딩"
        popularTagsTitle="인기 태그"
        query=""
        retryText="재시도"
        searchClearText="초기화"
        searchPlaceholderText="검색"
        searchSubmitText="검색"
        tagLocale="ko"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'start-tag-pending' }));

    expect(screen.queryByText('article-feed')).toBeNull();
    expect(screen.getByRole('status', { name: '로딩' })).toHaveAttribute('aria-busy', 'true');
  });

  it('태그 뷰에서는 사이드 검색과 사이드 태그 패널을 숨기고 상단 태그만 렌더링한다', () => {
    render(
      <ArticlesInteractiveShell
        activeTag="react"
        emptyText="비어 있음"
        feedLocale="ko"
        initialCursor={null}
        initialItems={[]}
        loadErrorText="에러"
        loadMoreEndText="끝"
        loadingText="로딩"
        popularTagsDefaultLabel="전체"
        popularTagsEmptyText="없음"
        popularTagsLoadingText="태그 로딩"
        popularTagsTitle="인기 태그"
        query=""
        retryText="재시도"
        searchClearText="초기화"
        searchPlaceholderText="검색"
        searchSubmitText="검색"
        showSearchFormInSidebar={false}
        showTagFilterInSidebar={false}
        tagLocale="ko"
        topTagFilterSource="all"
        topTagFilterTitle="전체 태그"
      />,
    );

    expect(screen.queryByRole('button', { name: 'start-pending' })).toBeNull();
    expect(screen.getByRole('button', { name: 'start-tag-pending' })).toBeTruthy();
  });
});
