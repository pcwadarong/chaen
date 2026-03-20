import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { ArticlesInteractiveShell } from '@/views/articles/ui/articles-interactive-shell';

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
  DeferredArticleTagFilterList: ({ onNavigationStart }: { onNavigationStart?: () => void }) => (
    <button onClick={() => onNavigationStart?.()} type="button">
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
        initialCursor={null}
        initialItems={[]}
        loadErrorText="에러"
        loadMoreEndText="끝"
        loadingText="로딩"
        locale="ko"
        popularTagsEmptyText="없음"
        popularTagsLoadingText="태그 로딩"
        popularTagsTitle="tags"
        query=""
        retryText="재시도"
        searchClearText="초기화"
        searchPlaceholderText="검색"
        searchSubmitText="검색"
      />,
    );

    expect(screen.getByText('article-feed')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'start-pending' }));

    expect(screen.queryByText('article-feed')).toBeNull();
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it('태그 클릭 신호가 오면 목록 대신 피드 스켈레톤을 보여준다', () => {
    render(
      <ArticlesInteractiveShell
        activeTag=""
        emptyText="비어 있음"
        initialCursor={null}
        initialItems={[]}
        loadErrorText="에러"
        loadMoreEndText="끝"
        loadingText="로딩"
        locale="ko"
        popularTagsEmptyText="없음"
        popularTagsLoadingText="태그 로딩"
        popularTagsTitle="tags"
        query=""
        retryText="재시도"
        searchClearText="초기화"
        searchPlaceholderText="검색"
        searchSubmitText="검색"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'start-tag-pending' }));

    expect(screen.queryByText('article-feed')).toBeNull();
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
