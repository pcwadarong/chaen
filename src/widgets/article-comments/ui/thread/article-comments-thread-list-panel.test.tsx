import { render, screen } from '@testing-library/react';
import React from 'react';

import { createArticleCommentsText } from '@/widgets/article-comments/ui/state/article-comments-text';
import { CommentsThreadListPanel } from '@/widgets/article-comments/ui/thread/article-comments-thread-list-panel';

vi.mock('@/widgets/article-comments/ui/thread/article-comments-thread-item-view', () => ({
  CommentThreadItemView: () => <div data-testid="comment-thread-item-view" />,
}));

vi.mock('@/widgets/article-comments/ui/thread/article-comments-thread-list-skeleton', () => ({
  CommentsLoadingSkeleton: ({ loadingText }: { loadingText: string }) => (
    <div data-testid="comments-loading-skeleton">{loadingText}</div>
  ),
}));

const text = {
  ...createArticleCommentsText(key => key),
  emptyItems: '댓글 없음',
  loading: '불러오는 중',
  paginationLabel: '댓글 페이지 이동',
  retry: '다시 시도',
};

const pageData = {
  items: [],
  page: 1,
  pageSize: 10,
  sort: 'latest' as const,
  totalCount: 0,
  totalPages: 0,
};

describe('CommentsThreadListPanel', () => {
  it('초기 로딩 중에는 목록 skeleton을 보여준다', () => {
    render(
      <CommentsThreadListPanel
        activeReplyPlaceholder={null}
        articleId="article-1"
        errorMessage={null}
        isLoading
        isReplySubmitting={false}
        locale="ko"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onPageChange={vi.fn()}
        onReply={vi.fn()}
        onRetryLoad={vi.fn()}
        pageData={pageData}
        queryState={{ page: 1, sort: 'latest' }}
        replySubmitState={{ data: null, errorMessage: null, ok: false }}
        replyTarget={null}
        submitReplyCommentAction={vi.fn()}
        text={text}
      />,
    );

    expect(screen.getByTestId('comments-loading-skeleton').textContent).toBe('불러오는 중');
  });

  it('목록이 비어 있고 로딩이 끝났으면 empty state를 보여준다', () => {
    render(
      <CommentsThreadListPanel
        activeReplyPlaceholder={null}
        articleId="article-1"
        errorMessage={null}
        isLoading={false}
        isReplySubmitting={false}
        locale="ko"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onPageChange={vi.fn()}
        onReply={vi.fn()}
        onRetryLoad={vi.fn()}
        pageData={pageData}
        queryState={{ page: 1, sort: 'latest' }}
        replySubmitState={{ data: null, errorMessage: null, ok: false }}
        replyTarget={null}
        submitReplyCommentAction={vi.fn()}
        text={text}
      />,
    );

    expect(screen.getByText('댓글 없음')).toBeTruthy();
  });
});
